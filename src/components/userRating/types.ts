import { ITitleDoc } from "../title/model";
import { TitleWithUserRatedChildren } from "../title/types";
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
  type?: string | string[],
  year?: number,
  page?: number;
  itemPerPage?: number;
  sortBy?: string;
  direction?: -1 | 1;
}

export interface UserRatingDocWithTitle extends IUserRatingDoc{
  title?: TitleWithUserRatedChildren,
  parentTitle?: ITitleDoc,
}

export interface UserRatingQueryResult {
  pagination: {
    count: number,
    pageCount: number,
  },
  items: UserRatingDocWithTitle[],
}
