import csv from "csv-parser";
import fs from "fs";
import stream from "stream";
import util from "util";
import { logError, logger } from "../../utils";
import { DatasetConfig } from "../../config";
import { IUserRatingDoc, UserRating } from "./model";
import { ObjectId } from "mongodb";
import { UserRatingCsv, UserRatingCsvOjb, UserRatingQueryOptions, UserRatingQueryResult } from "./types";

const csvOptions = {
  separator: ",",
  quote: "",
  headers: Object.keys(UserRatingCsvOjb),
  skipLines: 1,
};

export class UserRatingController {

  public static async getById(id: string): Promise<IUserRatingDoc | null> {
    return UserRating.findById(id);
  }

  public static async getByUserIdAndImdbId(userId: string, imdbId: string): Promise<IUserRatingDoc | null> {
    const userObjId = new ObjectId(userId);
    return UserRating.findOne({userId: userObjId, imdbId});
  }

  public static async getByUserId(userId: string, options: UserRatingQueryOptions, overrideLimit?: boolean): Promise<UserRatingQueryResult | null> {
    const page = Number(options.page) || 1;
    const userItemPerPage = Number(options.itemPerPage) || 20;
    const itemPerPage = Math.min(Math.max(userItemPerPage, 10), 100);
    const skip = overrideLimit ? 0 : (page - 1) * itemPerPage;
    const sortBy = options.sortBy || "date";
    const sortDirection = Number(options.direction) || 1;

    const matches: Record<string, unknown>[] = [];
    matches.push({
      "$match": {
        "userId": new ObjectId(userId),
      }
    });
    if (options.rating){
      matches.push({
        "$match": {
          "rating": Number(options.rating),
        }
      });
    }
    if (options.name){
      matches.push({
        "$match": {
          "title.name": options.name,
        }
      });
    }
    if (options.type && typeof options.type === "string"){
      matches.push({
        "$match": {
          "title.type": options.type,
        }
      });
    }
    if (options.type && Array.isArray(options.type)){
      matches.push({
        "$match": {
          "title.type": { $in: options.type },
        }
      });
    }
    if (options.year){
      matches.push({
        "$match": {
          "title.year": Number(options.year),
        }
      });
    }

    try {

      const results = await UserRating.aggregate([
        {
          $lookup: {
            from: "titles",
            localField: "imdbId",
            foreignField: "imdbId",
            as: "title"
          }
        },
        { $unwind: "$title" },
        {
          $lookup: {
            from: "titles",
            localField: "title.parentImdbId",
            foreignField: "imdbId",
            as: "parentTitle"
          }
        },
        { $unwind: { path: '$parentTitle', preserveNullAndEmptyArrays: true } },
        ...matches,
        {
          $sort: {
            [sortBy]: sortDirection
          }
        },
        {
          $facet: {
            items: [{ $skip: skip }, { $limit: overrideLimit ? Number.MAX_SAFE_INTEGER : itemPerPage }],
            totalCount: [
              {
                $count: 'count'
              }
            ]
          }
        }
      ]);
      
      // eslint-disable-next-line
      const items: IUserRatingDoc[] = results[0].items;
      // eslint-disable-next-line
      const count = results[0].totalCount.length > 0 ? Number(results[0].totalCount[0].count) : 0;
      const pageCount = overrideLimit ? 1 : Math.ceil(count / itemPerPage);

      return {
        pagination: {
          count,
          pageCount,
        },
        items,
      };
    } catch (err) {
      logError(err, "UserRating - GetAll", { userId, options } );
      return Promise.reject(null);
    }
  }

  public static async parseUserRatings(
    userId: string,
    deleteFile?: boolean
  ): Promise<void> {
    logger.info(`Started parsing user ratings for user ${userId}`);
    const userRatingsFile = DatasetConfig.userRatingsPath + userId;
    const results: UserRatingCsv[] = [];

    const finished = util.promisify(stream.finished);
    const rs: any = fs
      .createReadStream(userRatingsFile)
      .pipe(csv(csvOptions))
      .on("data", (data: UserRatingCsv) => {
        results.push(data);
      })
      .on("error", function (err) {
        logger.error("Error reading user ratings file %s", err.message);
      });

    await finished(rs);
    logger.info(`Parsed ${results.length.toString()} user rating rows.`);

    if (results.length > 0){
      await UserRating.deleteMany({userId: new ObjectId(userId)});
    }

    await insertUserRatings(userId, results);

    if (deleteFile && fs.existsSync(userRatingsFile)) {
      fs.unlinkSync(userRatingsFile);
    }
    logger.info(`Finished parsing user ratings for user ${userId}`);
  }
}

async function insertUserRatings(
  userId: string,
  userRatings: UserRatingCsv[]
): Promise<void> {
  const documentNumStr: string = userRatings.length.toString();
  logger.info(`Starting to insert ${documentNumStr} user rating documents`);

  for (const [, userRating] of userRatings.entries()) {
    await UserRating.create({
      userId: new ObjectId(userId),
      imdbId: userRating.tconst,
      rating: Number(userRating.rating),
      date: new Date(userRating.date),
    }).catch((err: any) => {
      logError(err, "InsertUserRatings - Inserting", { userId, userRating } );
    });
  }

  logger.info(`Finished inserting ${documentNumStr} user rating documents`);
}
