import { ISettingDoc, Setting } from "../models/settingModel";
import { logger } from "../utils/logger";

export class SettingController {
  public static async getValue(key: string): Promise<string | null> {
    return Setting.findOne({ key }).then((setting) => {
      if (setting) {
        return setting.value;
      }
      return null;
    });
  }
  public static create(key: string, value: string): Promise<void> {
    const newSetting = new Setting({ key, value });
    Setting.create(newSetting).catch((err) => {
      logError(err, newSetting, "creating");
      return Promise.reject();
    });
    return Promise.resolve();
  }
}

function logError(err: any, setting: ISettingDoc, process: string) {
  if (err instanceof Error) {
    logger.error("Error %s settings doc: %s", process, err.message);
  } else {
    logger.error("Error %s settings doc: %o", process, err);
  }
  logger.error("Setting: %o", setting);
}
