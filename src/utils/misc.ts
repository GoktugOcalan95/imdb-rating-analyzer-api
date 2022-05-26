import { logger } from "./logger";

export function getStartTime(): [number, number] {
  return process.hrtime();
}

export function getElapsedTime(startTime: [number, number]): string {
  const diff = process.hrtime(startTime);
  const seconds = (diff[0] + diff[1] / 1e9).toFixed(3);
  return seconds;
}

export function calcProgress(
  current: number,
  total: number,
  reportStep: number
): number | null {
  if (current === total) {
    return 100;
  }

  const modularProgress = current % Math.ceil(total / (100 / reportStep));
  if (modularProgress === 0) {
    return Math.round((current * 100) / total);
  }

  return null;
}

export function isNumeric(str: string): boolean {
  return !isNaN(Number(str));
}

export function emptyFunction(): void {
  // do nothing.
}

export function logError(err: unknown, description: string): void {
  if (err instanceof Error) {
    logger.error("Error at %s - %s", description, err.message);
  } else {
    logger.error("Error at %s - %o", description, err);
  }
}

export function logErrorWithDetail(err: unknown, description: string, object: unknown, detailDescription: string): void {
  if (err instanceof Error) {
    logger.error("Error at %s - %s", description, err.message);
  } else {
    logger.error("Error at %s - %o", description, err);
  }
  logger.error("%s: %o", detailDescription, object);
}
