import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, {
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    }, "Health check successful"));
});

const rootHandler = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, {
          server: "vibe-express-server",
          status: "running",
          version: "1.0.0"
      }, "Vibe Express Server is up and running!"));
  });

export { healthCheck, rootHandler };