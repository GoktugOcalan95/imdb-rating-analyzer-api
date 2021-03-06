import { Agenda } from "agenda";
import { Db } from "mongodb";
import { logger } from "./utils/logger";
import { DatasetController } from "./components/dataset/controller";
import { SettingController } from "./components/setting/controller";
import { CommonSettings } from "./components/dataset/types";

export async function setupAgenda(mongoDb: Db): Promise<void> {
  const agenda = new Agenda({ mongo: mongoDb });

  agenda.define("update dataset", { concurrency: 1 }, async () => {
    logger.info("Starting scheduled job to update title dataset");
    await DatasetController.updateAll();
  });

  const defaultDailyUpdateTimeString = "0 3 * * *";
  const dailyUpdateTimeString = await SettingController.getValue(CommonSettings.dailyUpdateTimeString);
  if (!dailyUpdateTimeString) {
    void SettingController.create(CommonSettings.dailyUpdateTimeString, defaultDailyUpdateTimeString);
  }

  await agenda.start();
  const agendaScheduleTimeString = dailyUpdateTimeString || defaultDailyUpdateTimeString;
  await agenda.every(agendaScheduleTimeString, "update dataset", {}, { timezone:"America/Toronto", skipImmediate: true });
}
