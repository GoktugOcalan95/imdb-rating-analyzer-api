import { ITitleDoc, Title } from "./model";
import { logError } from "../../utils";
import { TitleQueryResult, TitleQueryOptions } from "./types";
import { ObjectId } from "mongodb";

export class TitleController {

  public static async getById(id: string): Promise<ITitleDoc | null> {
    return Title.findById(id);
  }

  public static async getByImdbId(imdbId: string): Promise<ITitleDoc | null> {
    return Title.findOne({imdbId});
  }

  public static async getAll(options: TitleQueryOptions): Promise<TitleQueryResult | null> {
    const page = options.page || 1;
    const itemPerPage = options.itemPerPage || 20;
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
      logError(err, "Title - GetAll", options);
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

  public static async getEpisodesWithUserRating(parentImdbId: string, userId: string): Promise<ITitleDoc | null> {
    try {
      const results = await Title.aggregate( [
        {
          $match: {
            "imdbId": parentImdbId
          }
        },
        {
          $lookup: {
            from: "titles",
            let: { 'childImdbId': '$children' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$imdbId', '$$childImdbId'] // Todo: If a series has no children then this line causes an error, tt0361240
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
      const title: ITitleDoc = results[0];
      return title;
      
    } catch (err) {
      logError(err, "Title - getEpisodesWithUserRating", { parentImdbId, userId });
      return Promise.reject(null);
    }
  }

}