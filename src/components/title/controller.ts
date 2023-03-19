import { ITitleDoc, Title } from "./model";
import { logError, roundNumber } from "../../utils";
import { TitleQueryResult, TitleQueryOptions, SeasonsQueryResult, TitleWithChildren, SeasonData, TitleWithUserRating, TitleWithUserRatedChildren } from "./types";
import { ObjectId } from "mongodb";
import { UserRatingController } from "../userRating/controller";

export class TitleController {

  public static async getById(id: string): Promise<ITitleDoc | null> {
    return Title.findById(id);
  }

  public static async getByImdbId(imdbId: string): Promise<ITitleDoc | null> {
    return Title.findOne({imdbId});
  }

  public static async getAll(options: TitleQueryOptions): Promise<TitleQueryResult | null> {
    const page = Number(options.page) || 1;
    const userItemPerPage = Number(options.itemPerPage) || 20;
    const itemPerPage = Math.min(Math.max(userItemPerPage, 10), 100);
    const skip = (page - 1) * itemPerPage;

    const query: TitleQueryOptions = {};
    if (options.imdbId){
      query.imdbId = options.imdbId;
    }
    try {
      const countPromise = Title.countDocuments(query);
      const itemsPromise = Title.find(query).limit(itemPerPage).skip(skip);
      const [count, items] = await Promise.all([countPromise, itemsPromise]);
  
      const pageCount = Math.ceil(count / itemPerPage);

      return {
        pagination: {
          count,
          pageCount,
        },
        items,
      };
    } catch (err) {
      logError(err, "Title - getAll", options);
      return Promise.reject(null);
    }
  }

  public static async searchByName(name: string, type?: string[]): Promise<ITitleDoc[] | null> {
    try {
      const results = await Title.aggregate()
        .match(
          {
            $text: {
              $search: name,
              $caseSensitive: false,
              $diacriticSensitive: false
            },
            type: type ? { $in: type } : { $exists: true }, 
          },
        )
        .project({ imdbId: 1, name: 1, year: 1, type: 1, votes: 1, score: { $multiply: [ { $add: [{$floor: {$log10: "$votes"}}, 1] }, { $meta: "textScore" } ] } })
        .sort( { score: -1, votes: -1 } )
        .limit(5);

      // eslint-disable-next-line
      return results;
    } catch (err) {
      logError(err, "Title - searchByName", { name });
      return Promise.reject(null);
    }
  }

  public static async getEpisodesWithUserRating(parentImdbId: string, userId: string): Promise<TitleWithChildren | null> {
    try {
      const results = await Title.aggregate( [
        {
          $match: {
            imdbId: parentImdbId,
            children: { $exists: true, $type: 'array', $ne: [] }
          }
        },
        {
          $lookup: {
            from: "titles",
            let: { 'childImdbId': '$children.imdbId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$imdbId', '$$childImdbId']
                  }
                }
              },
              {
                $lookup: {
                  from: "userRatings",
                  let: { 'currentChildImdbId': '$imdbId' },
                  pipeline: [{
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [ "$userId",  new ObjectId(userId) ] },
                          { $eq: [ "$imdbId",  '$$currentChildImdbId' ] },
                        ]
                      }
                    }
                  }],
                  as: "userRating"
                }
              }
            ],
            as: "children"
          }
        },
        {
          $lookup: {
            from: "userRatings",
            pipeline: [{
              $match: {
                $expr: {
                  $and: [
                    { $eq: [ "$userId",  new ObjectId(userId) ] },
                    { $eq: [ "$imdbId",  parentImdbId ] },
                  ]
                }
              }
            }],
            as: "userRating"
          }
        }
      ]);

      // eslint-disable-next-line
      const title: TitleWithChildren = results[0];
      return title;
      
    } catch (err) {
      logError(err, "Title - getEpisodesWithUserRating", { parentImdbId, userId });
      return Promise.reject(null);
    }
  }

  public static async getByImdbIdWithUserRating(imdbId: string, userId: string): Promise<TitleWithUserRating | null> {
    try{
      const results = await Title.aggregate( [
        {
          $match: { imdbId }
        },
        {
          $lookup: {
            from: "userRatings",
            pipeline: [{
              $match: {
                $expr: {
                  $and: [
                    { $eq: [ "$userId",  new ObjectId(userId) ] },
                    { $eq: [ "$imdbId",  imdbId ] },
                  ]
                }
              }
            }],
            as: "userRating"
          }
        }
      ]);

      // eslint-disable-next-line
      const title: TitleWithUserRating = results[0];
      return title;

    } catch (err) {
      logError(err, "Title - getByImdbIdWithUserRating", { imdbId, userId });
      return Promise.reject(null);
    }
  }
  
  public static async getUserRatedSeries(userId: string): Promise<TitleWithUserRatedChildren[] | null> {
    try {
      const series = await UserRatingController.getByUserId(userId, { type: ["tvSeries", "tvMiniSeries"] }, true);
      if (!series){
        return Promise.reject(null);
      }

      const episodes = await UserRatingController.getByUserId(userId, { type: ["tvEpisode"] }, true);
      const titles: ITitleDoc[] = [];
      for (const item of series.items) {
        if (item.title){
          if (episodes?.items){
            item.title.children?.forEach(child => {
              child.userRating = episodes.items.find(episode => episode.imdbId === child.imdbId)?.rating;
            })
          }
          titles.push(item.title);
        }
      }
  
      return titles;

    } catch (err) {
      logError(err, "Title - getUserRatedSeries", { userId });
      return Promise.reject(null);
    }
  }

  public static async getSeasonsFromUserRatedSeries(userId: string): Promise<SeasonsQueryResult[] | null> {
    try {
      const series = await this.getUserRatedSeries(userId);
      const results: SeasonsQueryResult[] = [];

      series?.forEach(title => {
        const seasons = new Map<number, SeasonData>();
        title.children?.forEach(child => {
          if (!child.season || !child.rating) { return; }

          const season = seasons.get(child.season);
          if (season) {
            season.rating += child.rating;
            if (child.userRating){
              if (season.userRating && season.userRatedEpisodeCount){ 
                season.userRating += child.userRating;
                season.userRatedEpisodeCount += 1;
              }
              else{ 
                season.userRating = child.userRating;
                season.userRatedEpisodeCount = 1;
              }
            }
            season.episodeCount += 1;
          }
          else {
            seasons.set(child.season, {
              season: child.season,
              rating: child.rating,
              userRating: child.userRating,
              episodeCount: 1,
              userRatedEpisodeCount: child.userRating ? 1 : undefined,
            });
          }
        });

        const seasonsArray = Array.from(seasons.values());
        seasonsArray.forEach(season => { 
          season.rating = roundNumber(season.rating / season.episodeCount, 4);
          season.userRating = season.userRating && season.userRatedEpisodeCount ? roundNumber(season.userRating / season.userRatedEpisodeCount, 4) : undefined;
        });
        results.push({
          imdbId: title.imdbId,
          name: title.name,
          year: title.year,
          endYear: title.endYear,
          rating: title.rating,
          votes: title.votes,
          seasons: seasonsArray,
        });
        
      });

      return results;

    } catch (err) {
      logError(err, "Title - getSeasonsFromUserRatedSeries", { userId });
      return Promise.reject(null);
    }
  }

}