import logger from "../logger/winston.logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * This middleware is responsible for catching errors from any request handler
 * wrapped inside {@link asyncHandler}.
 */
const errorHandler = (err, req, res, next) => {
  let error;

  // Normalize any thrown value into an ApiError instance
  if (err instanceof ApiError) {
    error = err;
  } else {
    // Preserve original behavior:
    // - If a statusCode exists on the error, default to 400
    // - Otherwise, use 500
    const statusCode = err?.statusCode || 500;
    const message = err?.message || "Something went wrong";

    error = new ApiError(
      statusCode,
      message,
      err?.errors || [],
      err?.stack
    );
  }

  // Shape the response; include stack only in development
  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development"
      ? { stack: error.stack }
      : {}),
  };

  logger.error(`${error.message}`);

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
