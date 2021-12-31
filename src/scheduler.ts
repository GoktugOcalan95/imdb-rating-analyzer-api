import { Agenda } from "agenda";
import { Db } from "mongodb";
import { logger } from "./utils/logger";
import { DatasetController } from "./components/dataset/controller";

export async function setupAgenda(mongoDb: Db): Promise<void> {
  const agenda = new Agenda({ mongo: mongoDb });

  agenda.define("update dataset", { concurrency: 1 }, async () => {
    logger.info("Starting scheduled job to update title dataset");
    await DatasetController.updateAll();
  });

  await agenda.start();

  await agenda.every("0 3 * * *", "update dataset");
}
