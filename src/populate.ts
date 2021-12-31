import { parseAll } from "./data";
import { AppConfig } from "./config";

export async function populate(): Promise<void> {
  await parseAll(AppConfig.progressStep);
}
