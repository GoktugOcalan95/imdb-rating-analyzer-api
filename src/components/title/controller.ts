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
      const title: ITitleDoc = results[0];
      return title;
      
    } catch (err) {
      logError(err, "Title - getEpisodesWithUserRating", { parentImdbId, userId });
      return Promise.reject(null);
    }
  }
}