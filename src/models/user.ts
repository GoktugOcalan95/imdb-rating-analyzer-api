import mongoose from "mongoose";
import { Document, Model, Schema } from "mongoose";

export interface IUserDoc extends Document {
  email: string;
  password?: string;
  imdbUserId?: string;
}

export const UserSchema = new Schema(
  {
    email: { type: String, index: { unique: true } },
    password: String,
    imdbUserId: { type: String, unique: true },
  },
  { collection: "users" }
);

export type UserModel = Model<IUserDoc>;

export const User: UserModel = <UserModel>(
  mongoose.model<IUserDoc>("User", UserSchema)
);
