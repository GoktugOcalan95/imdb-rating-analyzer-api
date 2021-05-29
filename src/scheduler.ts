import { Agenda } from "agenda";
import { parseAll } from "./data";
import { Db } from "mongodb";
import { AppConfig } from "./config";
import { logger } from "./utils/logger";

export async function setupAgenda(mongoDb: Db): Promise<void> {
  const agenda = new Agenda({ mongo: mongoDb });

  agenda.define("parse data", { concurrency: 1 }, async () => {
    logger.info("Starting scheduled job to parse data");
    const progressStep = AppConfig.progressStep;
    await parseAll(progressStep);
  });

  await agenda.start();

  await agenda.every("0 4 * * *", "parse data");
}
