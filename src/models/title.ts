import mongoose from "mongoose";
import { Document, Model, Schema } from "mongoose";

export interface ITitleDoc extends Document {
  imdbId: string;
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
  children?: string[];
}

export const TitleSchema = new Schema(
  {
    imdbId: { type: String, index: { unique: true } },
    type: String,
    name: String,
    year: Number,
    endYear: Number,
    runtime: Number,
    rating: Number,
    votes: Number,
    genres: { type: [String], default: undefined },
    parentImdbId: String,
    season: Number,
    episode: Number,
    children: { type: [String], default: undefined },
  },
  { collection: "titles" }
);

export type TitleModel = Model<ITitleDoc>;

export const Title: TitleModel = <TitleModel>(
  mongoose.model<ITitleDoc>("Title", TitleSchema)
);
