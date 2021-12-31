import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { Document, Model, Schema } from "mongoose";

export interface IUserRatingDoc extends Document {
  userId: ObjectId;
  imdbId: string;
  rating: number;
  date: Date;
}

export const UserRatingSchema = new Schema(
  {
    userId: ObjectId,
    imdbId: String,
    rating: Number,
    date: Date,
  },
  { collection: "userRatings" }
);
UserRatingSchema.index({ userId: 1, imdbId: 1 }, { unique: true });

export type UserRatingModel = Model<IUserRatingDoc>;

export const UserRating: UserRatingModel = <UserRatingModel>(
  mongoose.model<IUserRatingDoc>("UserRating", UserRatingSchema)
);
