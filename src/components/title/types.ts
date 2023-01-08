import { IUserRatingDoc } from "../userRating/model";
import { ITitleDoc } from "./model";

export interface TitleQueryOptions {
  imdbId?: string;
  type?: string;
  name?: string;
  year?: number;
  endYear?: number;
  runtime?: number;
  rating?: number;
  votes?: number;
  genres?: string[];
  parentImdbId?: string;
  season?: number;
  episode?: number;
  page?: number;
  itemPerPage?: number;
  sortBy?: string;
  direction?: string;
}

export interface TitleQueryResult {
  pagination: {
    count: number,
    pageCount: number,
  },
  items: ITitleDoc[],
}

export interface TitleWithChildren extends ITitleDoc {
  children?: ITitleDoc[];
}

export interface TitleWithUserRatedChildren extends ITitleDoc {
  children?: {
    imdbId?: string;
    season?: number;
    episode?: number;
    rating?: number;
    userRating?: number;
  }[];
}

export interface TitleWithUserRating extends ITitleDoc {
  userRating?: IUserRatingDoc
}

export interface SeasonData {
  season: number;
  rating: number;
  episodeCount: number;
  userRating?: number;
  userRatedEpisodeCount?: number;
}

export interface SeasonsQueryResult {
  imdbId?: string;
  name?: string;
  year?: number;
  endYear?: number;
  rating?: number;
  votes?: number;
  seasons?: SeasonData[];
}
