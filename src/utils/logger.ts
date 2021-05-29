import { createLogger, format, transports } from "winston";
import { AppConfig } from "../config";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    //
    // Write all logs with level `error` and below to `error.log`
    // Write all logs with level `info` and below to `combined.log`
    //
    new transports.File({
      filename: `${AppConfig.logPath}error.log`,
      level: "error",
      maxsize: 1000000,
      maxFiles: 10,
      tailable: true,
    }),
    new transports.File({
      filename: `${AppConfig.logPath}combined.log`,
      maxsize: 1000000,
      maxFiles: 10,
      tailable: true,
    }),
  ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize({ level: true }),
        format.simple(),
        format.splat()
      ),
    })
  );
}
