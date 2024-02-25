import mongoose from "mongoose";
import { Document, Model, Schema } from "mongoose";

export interface IUserDoc extends Document {
  username: string;
  password?: string;
  isAdmin: boolean;
}

export const UserSchema = new Schema(
  {
    username: { type: String, index: { unique: true } },
    password: String,
    isAdmin: { type: Boolean, default: false },
  },
  {
    collection: "users",
    versionKey: false
  }
);

export type UserModel = Model<IUserDoc>;

export const User: UserModel = <UserModel>(
  mongoose.model<IUserDoc>("User", UserSchema)
);
