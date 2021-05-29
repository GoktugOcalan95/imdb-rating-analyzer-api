export const MongoConfig = {
  db: process.env.MONGO_DB || "imdb",
  host: process.env.MONGO_HOST || "localhost",
  port: Number(process.env.MONGO_PORT) || 27017,
  password: process.env.MONGO_PWD,
  user: process.env.MONGO_USER,
};

export const AppConfig = {
  logPath: "./logs/",
  progressStep: Number(process.env.PROGRESS_STEP) || 10,
  minimumVotes: Number(process.env.MINIMMUM_VOTES) || 100,
  dropCollectionInterval: Number(process.env.DROP_COLLECTION_INTERVAL) || 7,
};

export const DatasetConfig = {
  basicsFileName: "basics.tsv",
  episodeFileName: "episode.tsv",
  ratingsFileName: "ratings.tsv",
  basicsPath: "./data/basics/",
  episodePath: "./data/episode/",
  ratingsPath: "./data/ratings/",
  userRatingsPath: "./data/userRatings/",
  basicsUrl: "https://datasets.imdbws.com/title.basics.tsv.gz",
  episodeUrl: "https://datasets.imdbws.com/title.episode.tsv.gz",
  ratingsUrl: "https://datasets.imdbws.com/title.ratings.tsv.gz",
};
