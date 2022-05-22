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
  itemPerPage?: 20 | 50 | 100;
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