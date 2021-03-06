import { ISettingDoc, Setting } from "./model";
import { logger } from "../../utils";

export class SettingController {
  public static async getValue(key: string): Promise<string | null> {
    return Setting.findOne({ key }).then((setting) => {
      if (setting) {
        return setting.value;
      }
      return null;
    });
  }
  public static create(
    key: string,
    value: string
  ): Promise<ISettingDoc | null> {
    const newSetting = new Setting({ key, value });
    const createdSetting = Setting.create(newSetting).catch((err) => {
      logError(err, newSetting, "creating");
      return Promise.reject(null);
    });
    return Promise.resolve(createdSetting);
  }
  public static async update(
    key: string,
    value: string
  ): Promise<ISettingDoc | null> {
    const setting = await Setting.findOne({ key });
    if (!setting) {
      return Promise.reject(null);
    }
    setting.value = value;
    setting.save().catch((err) => {
      logError(err, setting, "updating");
      return Promise.reject(null);
    });
    return await Promise.resolve(setting);
  }
}

function logError(err: any, setting: ISettingDoc, process: string) {
  if (err instanceof Error) {
    logger.error("Error %s setting doc: %s", process, err.message);
  } else {
    logger.error("Error %s setting doc: %o", process, err);
  }
  logger.error("Setting: %o", setting);
}
