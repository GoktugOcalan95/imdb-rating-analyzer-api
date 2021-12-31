import csv from "csv-parser";
import fs from "fs";
import stream from "stream";
import util from "util";
import { logger } from "../../utils";
import { DatasetConfig } from "../../config";
import { UserRating } from "./model";
import { ObjectId } from "mongodb";
import { UserRatingCsv, UserRatingCsvOjb } from "./types";

const csvOptions = {
  separator: ",",
  quote: "",
  headers: Object.keys(UserRatingCsvOjb),
  skipLines: 1,
};

export class UserRatingController {
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
        handleUserRatingError(err, userRating, "updating", userId);
      });
    } else {
      UserRating.create({
        userId: new ObjectId(userId),
        imdbId: userRating.tconst,
        rating: Number(userRating.rating),
        date: new Date(userRating.date),
      }).catch((err: any) => {
        handleUserRatingError(err, userRating, "inserting", userId);
      });
    }
  }

  logger.info(`Finished inserting ${documentNumStr} user rating documents`);
}

function handleUserRatingError(
  err: any,
  userRating: UserRatingCsv,
  process: string,
  userId: string
) {
  if (err instanceof Error) {
    logger.error("Error %s doc: %s", process, err.message);
  } else {
    logger.error("Error %s doc: %o", process, err);
  }
  logger.error("UserId: %s", userId);
  logger.error("User Rating Row: %o", userRating);
}
