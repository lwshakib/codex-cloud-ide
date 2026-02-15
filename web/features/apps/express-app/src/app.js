import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import requestIp from "request-ip";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import "dotenv/config";
import morganMiddleware from "./logger/morgan.logger.js";
import { errorHandler } from "./middlewares/error.middlewares.js";
import { ApiError } from "./utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine setup (optional but included for compatibility with provided snippet)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Swagger Setup
const swaggerFile = fs.readFileSync(path.resolve(__dirname, "./swagger.yaml"), "utf8");
const swaggerDocument = YAML.parse(swaggerFile);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(requestIp.mw());

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    return req.clientIp; // IP address from requestIp.mw()
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 429,
      `Too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

app.use(limiter);
app.use(morganMiddleware);
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));

// routes declaration
app.get("/", (req, res) => {
    res.render("index");
});

app.use("/api", routes);

// Swagger Documentation
app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      swaggerOptions: {
        docExpansion: "none",
      },
      customSiteTitle: "Vibe Express API Documentation",
    })
);

// common error handler
app.use(errorHandler);

export default app;
