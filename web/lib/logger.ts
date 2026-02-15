/**
 * Logger utility for the Vibe coding platform.
 * Supports different log levels and automatic timestamping.
 */
export type LogLevel = "info" | "warn" | "error" | "debug";

export const log = (message: string, level: LogLevel = "info") => {
  const timestamp = new Date().toISOString();
  const prefix = `[Vibe][${level.toUpperCase()}][${timestamp}]`;
  
  switch (level) {
    case "error":
      console.error(`${prefix}: ${message}`);
      break;
    case "warn":
      console.warn(`${prefix}: ${message}`);
      break;
    case "debug":
      console.debug(`${prefix}: ${message}`);
      break;
    default:
      console.log(`${prefix}: ${message}`);
  }
};

export const clearLogs = () => {
  console.clear();
  log("Console cleared", "info");
};
