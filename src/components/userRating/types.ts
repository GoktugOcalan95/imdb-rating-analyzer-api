import { IUserRatingDoc } from "./model";

export interface UserRatingCsv {
  tconst: string;
  rating: string;
  date: string;
}

export const UserRatingCsvOjb = {
  tconst: "",
  rating: "",
  date: "",
};

export interface UserRatingQueryOptions {
  userId?: string;
  imdbId?: string;
  rating?: number;
  date?: Date;
  name?: string,
  type?: string,
  year?: number,
  page?: number;
  itemPerPage?: 20 | 50 | 100;
  sortBy?: string;
  direction?: -1 | 1;
}

export interface UserRatingQueryResult {
  pagination: {
    count: number,
    pageCount: number,
  },
  items: IUserRatingDoc[],
}
