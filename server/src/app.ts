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

app.use("/api/auth", toNodeHandler(auth));

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/health", (req, res) => {
  res.send("API is healthy");
});

// Preview Proxy
app.use("/preview/:workspaceId", async (req, res) => {
  const { workspaceId } = req.params;
  const subPath = req.url; // In app.use, req.url is the remaining part after the prefix
  
  if (!workspaceId) {
    return res.status(400).send("Workspace ID is required.");
  }

  try {
    const DockerService = (await import("./services/docker.services")).default;
    const info = await DockerService.getContainerInfo(workspaceId as string);
    
    if (!info) {
      return res.status(404).send("Workspace container not found. Try starting the workspace first.");
    }
    
    // Check ports in order of preference: 3000, 5173
    const port3000 = info.NetworkSettings.Ports["3000/tcp"]?.[0]?.HostPort;
    const port5173 = info.NetworkSettings.Ports["5173/tcp"]?.[0]?.HostPort;
    const hostPort = port3000 || port5173;

    if (!hostPort) {
      return res.status(404).send("No preview port (3000 or 5173) is currently mapped for this container.");
    }

    const targetUrl = `http://localhost:${hostPort}/${subPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    
    const proxyReq = http.request(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: `localhost:${hostPort}` }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.status(502).send("Target application not responding. Is the dev server running?");
    });

    req.pipe(proxyReq);
  } catch (error) {
    console.error("Preview proxy error:", error);
    res.status(500).send("Internal server error in preview proxy.");
  }
});

app.use("/api", routes);


const httpServer = http.createServer(app);




app.use(morganMiddleware);
app.use(errorHandler);


export default httpServer;
