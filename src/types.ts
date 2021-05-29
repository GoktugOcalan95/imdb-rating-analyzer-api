export interface RatingTsv {
  tconst: string;
  averageRating: string;
  numVotes: string;
}

export interface BasicTsv {
  tconst: string;
  titleType: string;
  primaryTitle: string;
  originalTitle: string;
  isAdult: string;
  startYear: string;
  endYear: string;
  runtimeMinutes: string;
  genres: string;
}

export interface EpisodeTsv {
  tconst: string;
  parentTconst: string;
  seasonNumber: string;
  episodeNumber: string;
}

export interface UserRatingTsv {
  tconst: string;
  rating: string;
  date: string;
}
