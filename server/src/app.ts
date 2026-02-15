import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./services/auth.services";
import { WEB_URL } from "./env";
import { errorHandler } from "./middlewares/error.middlewares";
import morganMiddleware from "./logger/morgan.logger";



import routes from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: WEB_URL || "http://localhost:3000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(helmet());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/health", (req, res) => {
  res.send("API is healthy");
});

app.use("/api", routes);

const httpServer = http.createServer(app);




app.use(morganMiddleware);
app.use(errorHandler);


export default httpServer;
