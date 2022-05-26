import csv from "csv-parser";
import fs from "fs";
import stream from "stream";
import util from "util";
import { logErrorWithDetail, logger } from "../../utils";
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

  public static async getByUserId(userId: string): Promise<IUserRatingDoc[] | null> {
    const userObjId = new ObjectId(userId);
    return UserRating.find({userId: userObjId});
  }

  public static async getByUserIdAndImdbId(userId: string, imdbId: string): Promise<IUserRatingDoc | null> {
    const userObjId = new ObjectId(userId);
    return UserRating.findOne({userId: userObjId, imdbId});
  }

  public static async getAll(options: UserRatingQueryOptions): Promise<UserRatingQueryResult | null> {
    const page = options.page || 1;
    const itemPerPage = options.itemPerPage || 20;
    const skip = (page - 1) * itemPerPage;

    const query: UserRatingQueryOptions = {};
    if (options.userId){
      query.userId = options.userId;
    }
    try {
      const countPromise = UserRating.countDocuments(query);
      const itemsPromise = UserRating.find(query).limit(itemPerPage).skip(skip);
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
      logErrorWithDetail(err, "UserRating - GetAll", options, "UserRating Query Options");
      return Promise.reject(null);
    }
  }


  public static async parseUserRatings(
    userId: string,
    deleteFile?: boolean
  ): Promise<void> {
    logger.info(`Started parsing user ratings for user ${userId}`);
    const userRatingsFile = DatasetConfig.userRatingsPath + userId + ".csv";
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
    const userRatingRecord = await UserRating.findOne({
      userId: new ObjectId(userId),
      imdbId: userRating.tconst,
    });
    if (userRatingRecord) {
      userRatingRecord.rating = Number(userRating.rating);
      userRatingRecord.date = new Date(userRating.date);
      userRatingRecord.save().catch((err: any) => {
        logErrorWithDetail(err, "InsertUserRatings - Updating", userRating, "User Rating Row");
        logger.error("UserId: %s", userId);
      });
    } else {
      UserRating.create({
        userId: new ObjectId(userId),
        imdbId: userRating.tconst,
        rating: Number(userRating.rating),
        date: new Date(userRating.date),
      }).catch((err: any) => {
        logErrorWithDetail(err, "InsertUserRatings - Inserting", userRating, "User Rating Row");
        logger.error("UserId: %s", userId);
      });
    }
  }

  logger.info(`Finished inserting ${documentNumStr} user rating documents`);
}
