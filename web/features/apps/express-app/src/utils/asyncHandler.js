/**
 * Higher-order function that wraps async route handlers to catch errors.
 * Ensures rejected promises are forwarded to Express error middleware.
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

export { asyncHandler };
