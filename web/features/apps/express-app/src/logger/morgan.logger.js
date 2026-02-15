import morgan from "morgan";
import logger from "./winston.logger.js";
import { NODE_ENV } from "../env.js";

// Winston-compatible stream for Morgan
const stream = {
  // Use the HTTP severity level
  write: (message) => {
    logger.http(message.trim());
  },
};

const skip = () => {
  const env = NODE_ENV ?? "development";
  return env !== "development";
};

// Morgan middleware
const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  {
    stream,
    skip,
  }
);

export default morganMiddleware;
