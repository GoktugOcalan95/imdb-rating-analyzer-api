import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { Document, Model, Schema } from "mongoose";

export interface IUserRatingDoc extends Document {
  userId: ObjectId;
  imdbId: string;
  rating?: number;
  date?: Date;
}

export const UserRatingSchema = new Schema(
  {
    userId: { type: ObjectId, index: true },
    imdbId: String,
    rating: Number,
    date: Date,
  },
  { collection: "userRatings" }
);

export type UserRatingModel = Model<IUserRatingDoc>;

export const UserRating: UserRatingModel = <UserRatingModel>(
  mongoose.model<IUserRatingDoc>("UserRating", UserRatingSchema)
);
