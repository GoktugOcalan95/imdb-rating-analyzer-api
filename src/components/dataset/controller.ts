import { ITitleDoc, Title } from "../title/model";
import csv from "csv-parser";
import fs from "fs";
import stream from "stream";
import util from "util";
import { logger, calcProgress, downloadFile, unzipGzFile } from "../../utils";
import { AppConfig, DatasetConfig } from "../../config";
import moment from "moment";
import { SettingController } from "../setting/controller";
import { BasicTsv, CommonSettings, EpisodeTsv, RatingTsv } from "./types";

const ratingsFile = DatasetConfig.ratingsPath + DatasetConfig.ratingsFileName;
const ratingsZip = ratingsFile + ".gz";
const basicsFile = DatasetConfig.basicsPath + DatasetConfig.basicsFileName;
const basicsZip = basicsFile + ".gz";
const episodeFile = DatasetConfig.episodePath + DatasetConfig.episodeFileName;
const episodeZip = episodeFile + ".gz";
const tsvOptions = { separator: "\t", quote: "" };

export class DatasetController {
  public static async updateAll(): Promise<void> {
    logger.info("Started updating the title dataset");
    await cleanCollection();
    await downloadRatingsFile();
    await downloadBasicsFile();
    await downloadEpisodeFile();
    await parseRatings(AppConfig.progressStep);
    await parseBasics(AppConfig.progressStep);
    await parseEpisodes(AppConfig.progressStep);
    logger.info("Finished updating the title dataset");
  }
}

async function cleanCollection(): Promise<void> {
  const lastDrop = await SettingController.getValue(CommonSettings.lastDrop);
  if (lastDrop) {
    const lastDropDate = moment(lastDrop, "YYYY-MM-DD");
    const daysPast = moment().diff(lastDropDate, "days");
    if (daysPast < AppConfig.dropCollectionInterval) {
      logger.info(`Last collection drop was ${daysPast.toString()} days ago`);
      return;
    }
    void SettingController.update(
      CommonSettings.lastDrop,
      moment().format("YYYY-MM-DD")
    );
  } else {
    void SettingController.create(
      CommonSettings.lastDrop,
      moment().format("YYYY-MM-DD")
    );
  }
  logger.info("Dropping titles collection");
  await Title.collection.drop();
  await Title.collection.createIndex({ imdbId: 1 });
}

async function parseRatings(progressStep?: number): Promise<void> {
  logger.info("Started parsing ratings");
  const results: RatingTsv[] = [];
  let rowsParsed = 0;

  const finished = util.promisify(stream.finished);
  const rs: any = fs
    .createReadStream(ratingsFile)
    .pipe(csv(tsvOptions))
    .on("data", (data: RatingTsv) => {
      if (Number(data.numVotes) >= AppConfig.minimumVotes) {
        results.push(data);
      }
      rowsParsed++;
    })
    .on("error", function (err) {
      logger.error("Error reading ratings file %s", err.message);
    });

  await finished(rs);
  logger.info(`Parsed ${rowsParsed.toString()} rating rows.`);

  await insertRatings(results, progressStep);
}

async function downloadRatingsFile(): Promise<void> {
  if (fs.existsSync(ratingsZip)) {
    fs.unlinkSync(ratingsZip);
  }
  if (fs.existsSync(ratingsFile)) {
    fs.unlinkSync(ratingsFile);
  }

  logger.info("Downloading ratings file");
  await downloadFile(DatasetConfig.ratingsUrl, ratingsZip).catch(
    (err: string) => {
      logger.error("Error downloading ratings file: %s", err);
    }
  );

  logger.info("Unzipping ratings file");
  await unzipGzFile(ratingsZip, ratingsFile).catch((err: string) => {
    logger.error("Error unzipping ratings file: %s", err);
  });
}

async function insertRatings(
  ratings: RatingTsv[],
  progressStep?: number
): Promise<void> {
  const documentNum: number = ratings.length;
  logger.info(`Starting to insert ${documentNum.toString()} rating documents`);

  for (const [index, rating] of ratings.entries()) {
    const title = await Title.findOne({ imdbId: rating.tconst });
    if (title) {
      convertTsvToModel(title, undefined, rating, undefined)
        .save()
        .catch((err: any) => {
          handleRatingError(err, rating, "updating");
        });
    } else {
      Title.create(
        convertTsvToModel(undefined, undefined, rating, undefined)
      ).catch((err: any) => {
        handleRatingError(err, rating, "inserting");
      });
    }
    if (progressStep) {
      handleProgress(index, documentNum, progressStep);
    }
  }
}

async function parseBasics(progressStep?: number): Promise<void> {
  logger.info("Started parsing basics");
  const results: BasicTsv[] = [];

  const finished = util.promisify(stream.finished);

  const rs: any = fs
    .createReadStream(basicsFile)
    .pipe(csv(tsvOptions))
    .on("data", (data: BasicTsv) => results.push(data))
    .on("error", function (err) {
      logger.error("Error reading basics file %s", err.message);
    });

  await finished(rs);
  logger.info(`Parsed ${results.length.toString()} basics rows.`);

  await insertBasics(results, progressStep);
}

async function downloadBasicsFile(): Promise<void> {
  if (fs.existsSync(basicsZip)) {
    fs.unlinkSync(basicsZip);
  }
  if (fs.existsSync(basicsFile)) {
    fs.unlinkSync(basicsFile);
  }

  logger.info("Downloading basics file");
  await downloadFile(DatasetConfig.basicsUrl, basicsZip).catch(
    (err: string) => {
      logger.error("Error downloading basics file: %s", err);
    }
  );

  logger.info("Unzipping basics file");
  await unzipGzFile(basicsZip, basicsFile).catch((err: string) => {
    logger.error("Error unzipping basics file: %s", err);
  });
}

async function insertBasics(
  basics: BasicTsv[],
  progressStep?: number
): Promise<void> {
  logger.info("Started inserting basics documents");
  const documentNum: number = basics.length;

  for (const [index, basic] of basics.entries()) {
    const title = await Title.findOne({ imdbId: basic.tconst });
    if (title) {
      if (!title.name) {
        convertTsvToModel(title, basic, undefined, undefined)
          .save()
          .catch((err: any) => {
            handleBasicError(err, basic);
          });
      }
    }
    if (progressStep) {
      handleProgress(index, documentNum, progressStep);
    }
  }
}

async function parseEpisodes(progressStep?: number): Promise<void> {
  logger.info("Started parsing episodes");
  const results: EpisodeTsv[] = [];

  const finished = util.promisify(stream.finished);

  const rs: any = fs
    .createReadStream(episodeFile)
    .pipe(csv(tsvOptions))
    .on("data", (data: EpisodeTsv) => results.push(data))
    .on("error", function (err) {
      logger.error("Error reading episodes file %s", err.message);
    });

  await finished(rs);
  logger.info(`Parsed ${results.length.toString()} episode rows.`);

  await insertEpisodes(results, progressStep);
}

async function downloadEpisodeFile(): Promise<void> {
  if (fs.existsSync(episodeZip)) {
    fs.unlinkSync(episodeZip);
  }
  if (fs.existsSync(episodeFile)) {
    fs.unlinkSync(episodeFile);
  }

  logger.info("Downloading episode file");
  await downloadFile(DatasetConfig.episodeUrl, episodeZip).catch(
    (err: string) => {
      logger.error("Error downloading episode file: %s", err);
    }
  );

  logger.info("Unzipping episode file");
  await unzipGzFile(episodeZip, episodeFile).catch((err: string) => {
    logger.error("Error unzipping episode file: %s", err);
  });
}

async function insertEpisodes(
  episodes: EpisodeTsv[],
  progressStep?: number
): Promise<void> {
  logger.info("Started inserting episodes documents");
  const documentNum: number = episodes.length;

  for (const [index, episode] of episodes.entries()) {
    const title = await Title.findOne({ imdbId: episode.tconst });
    if (title) {
      if (!title.parentImdbId) {
        convertTsvToModel(title, undefined, undefined, episode)
          .save()
          .catch((err: any) => {
            handleEpisodeError(err, episode, "child");
          });

        const parentTitle = await Title.findOne({
          imdbId: episode.parentTconst,
        });
        if (parentTitle) {
          if (parentTitle.children) {
            if (!parentTitle.children.includes(episode.tconst)) {
              parentTitle.children.push(episode.tconst);
            }
          } else {
            parentTitle.children = [episode.tconst];
          }
          await parentTitle.save().catch((err: any) => {
            handleEpisodeError(err, episode, "parent");
          });
        }
      }
    }
    if (progressStep) {
      handleProgress(index, documentNum, progressStep);
    }
  }
}

function convertTsvToModel(
  title?: ITitleDoc,
  basic?: BasicTsv,
  rating?: RatingTsv,
  episode?: EpisodeTsv
): ITitleDoc {
  if (!title) {
    title = new Title();
  }

  if (rating) {
    if (!title.imdbId && rating.tconst) {
      title.imdbId = rating.tconst;
    }
    if (rating.averageRating) {
      title.rating = Number(rating.averageRating);
    }
    if (rating.numVotes) {
      title.votes = Number(rating.numVotes);
    }
  }

  if (basic) {
    if (!title.imdbId && basic.tconst) {
      title.imdbId = basic.tconst;
    }
    if (basic.titleType) {
      title.type = basic.titleType;
    }
    if (basic.primaryTitle) {
      title.name = basic.primaryTitle;
    }
    if (basic.startYear && basic.startYear !== "\\N") {
      title.year = Number(basic.startYear);
    }
    if (basic.endYear && basic.endYear !== "\\N") {
      title.endYear = Number(basic.endYear);
    }
    if (basic.runtimeMinutes && basic.runtimeMinutes !== "\\N") {
      title.runtime = Number(basic.runtimeMinutes);
    }
    if (basic.genres && basic.genres !== "\\N") {
      title.genres = basic.genres.split(",");
    }
  }

  if (episode) {
    if (!title.imdbId && episode.tconst) {
      title.imdbId = episode.tconst;
    }
    if (episode.parentTconst) {
      title.parentImdbId = episode.parentTconst;
    }
    if (episode.seasonNumber && episode.seasonNumber !== "\\N") {
      title.season = Number(episode.seasonNumber);
    }
    if (episode.episodeNumber && episode.episodeNumber !== "\\N") {
      title.episode = Number(episode.episodeNumber);
    }
  }

  return title;
}

function handleProgress(index: number, total: number, progressStep: number) {
  const progress: number | null = calcProgress(index + 1, total, progressStep);
  if (progress) {
    logger.info(`Progress: ${progress.toString()}%`);
  }
}

function handleRatingError(err: any, rating: RatingTsv, process: string) {
  if (err instanceof Error) {
    logger.error("Error %s doc: %s", process, err.message);
  } else {
    logger.error("Error %s doc: %o", process, err);
  }
  logger.error("Rating Row: %o", rating);
}

function handleBasicError(err: any, basic: BasicTsv) {
  if (err instanceof Error) {
    logger.error("Error updating doc: %s", err.message);
  } else {
    logger.error("Error updating doc: %o", err);
  }
  logger.error("Basic Row: %o", basic);
}

function handleEpisodeError(err: any, episode: EpisodeTsv, target: string) {
  if (err instanceof Error) {
    logger.error("Error updating %s doc: %s", target, err.message);
  } else {
    logger.error("Error updating %s doc: %o", target, err);
  }
  logger.error("Episode Row: %o", episode);
}
