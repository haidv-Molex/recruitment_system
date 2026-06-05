import { createLogger, transports, format } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.errors({ stack: true }),
    format.splat()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ level, message, timestamp, stack, ...meta }) => {
          let metaString = "";
          if (Object.keys(meta).length) {
            metaString = "\n" + JSON.stringify(meta, null, 2);
          }
          if (stack) {
            return `[${timestamp}] ${level}: ${message}\n${stack}${metaString}`;
          }
          return `[${timestamp}] ${level}: ${message}${metaString}`;
        })
      )
    }),
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: format.json(), // vẫn JSON cho máy đọc
    }),
    new transports.File({
      filename: "logs/combined.log",
      format: format.json(),
    }),
  ],
});

export default logger;