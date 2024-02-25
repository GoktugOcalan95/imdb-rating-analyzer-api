import mongoose from "mongoose";
import { Document, Model, Schema } from "mongoose";

export interface ISettingDoc extends Document {
  key: string;
  value: string;
}

export const SettingSchema = new Schema(
  {
    key: { type: String, index: { unique: true } },
    value: String,
  },
  {
    collection: "settings",
    versionKey: false
  }
);

export type SettingModel = Model<ISettingDoc>;

export const Setting: SettingModel = <SettingModel>(
  mongoose.model<ISettingDoc>("Setting", SettingSchema)
);
