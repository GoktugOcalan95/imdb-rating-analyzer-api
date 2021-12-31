import mongoose from "mongoose";
import { MongoConfig } from "./config";
import { setupAgenda } from "./scheduler";

const mongoConnectionString = `mongodb://${MongoConfig.host}:${MongoConfig.port}/${MongoConfig.db}`;

export function connectToMongo(): void {
  mongoose.Promise = global.Promise;
  mongoose
    .connect(mongoConnectionString, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully connected to the database");
      void setupAgenda(mongoose.connection.db);
    })
    .catch((err: Error) => {
      console.log("Could not connect to the database. Exiting now...", err);
      process.exit();
    });
}
