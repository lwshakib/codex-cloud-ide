import Redis from "ioredis";
import { Server, Socket } from "socket.io";
import { produceMessage, produceUserPresence } from "./kafka.services";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "../env";
import { auth } from "./auth.services";
import { fromNodeHeaders } from "better-auth/node";

const pub = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
});

const sub = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
});

export default class SocketService {
  private _io: Server;
  private workspaceConnections = new Map<string, any>();

  constructor() {
    this._io = new Server({
      cors: {
        origin: process.env.WEB_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this._io.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(socket.handshake.headers),
        });

        if (!session) {
          return next(new Error("Unauthorized"));
        }

        socket.data.user = session.user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    sub.subscribe("MESSAGES");
  }

  initListeners() {
    const io = this.io;
    io.on("connection", (socket: Socket) => {
      const user = socket.data.user;
      const userId = user.id;

      console.log("A user connected:", { socketId: socket.id, userId });
      socket.join(userId);

      const handleConnectionPresence = async () => {
        try {
          const ts = new Date().toISOString();
          await produceUserPresence({ userId, isOnline: true, lastOnlineAt: ts });
          io.emit("presence:update", { userId, isOnline: true, lastOnlineAt: ts });
        } catch (e) {
          console.error("Failed to produce presence (join)", e);
        }
      };
      handleConnectionPresence();

      socket.on("event:message", async (data: any) => {
        await pub.publish("MESSAGES", JSON.stringify(data));
      });

      socket.on("join:server", (uid: string) => {
        socket.join(uid);
      });

      socket.on("workspace:join", async (workspaceId: string) => {
        try {
          console.log(`[Proxy] User ${userId} joining workspace ${workspaceId}`);
          const DockerService = (await import("./docker.services")).default;
          const { io: ioClient } = await import("socket.io-client");

          const container = await DockerService.createContainer(workspaceId);
          const inspectData = await DockerService.getContainerInfo(workspaceId);
          
          if (!inspectData) {
            return socket.emit("workspace:error", "Could not get container info");
          }

          const hostPort = inspectData.NetworkSettings.Ports["3001/tcp"]?.[0]?.HostPort;
          const ip = inspectData.NetworkSettings.Networks["app-network"]?.IPAddress;

          let containerUrl = "";
          if (hostPort) {
            containerUrl = `http://localhost:${hostPort}`;
          } else if (ip) {
            containerUrl = `http://${ip}:3001`;
          } else {
            return socket.emit("workspace:error", "Could not find container IP or port mapping");
          }

          let containerSocket = this.workspaceConnections.get(workspaceId);

          if (containerSocket) {
             console.log(`[Proxy] Reusing connection for ${workspaceId}`);
             if (containerSocket.connected) {
                socket.emit("workspace:ready", { workspaceId });
             } else {
                containerSocket.connect();
             }
          } else {
            console.log(`[Proxy] Creating connection to agent at ${containerUrl}`);
            containerSocket = ioClient(containerUrl, {
                transports: ["websocket"],
                reconnectionAttempts: 10,
                autoConnect: true
            });
            this.workspaceConnections.set(workspaceId, containerSocket);

            containerSocket.on("connect", () => {
                console.log(`[Proxy] ✅ Dynamic connection UP for ${workspaceId}`);
                socket.emit("workspace:ready", { workspaceId });
            });

            containerSocket.on("disconnect", () => {
                console.log(`[Proxy] ❌ Dynamic connection DOWN for ${workspaceId}`);
            });

            containerSocket.on("terminal:data", (data: any) => socket.emit("terminal:data", data));
            containerSocket.on("terminal:exit", (tid: string) => socket.emit("terminal:exit", tid));
            containerSocket.on("fs:list:result", (data: any) => socket.emit("fs:list:result", data));
            containerSocket.on("fs:read:result", (data: any) => socket.emit("fs:read:result", data));
            containerSocket.on("fs:write:success", (data: any) => socket.emit("fs:write:success", data));
            containerSocket.on("fs:error", (data: any) => socket.emit("fs:error", data));
          }

          socket.removeAllListeners("terminal:create");
          socket.removeAllListeners("terminal:input");
          socket.removeAllListeners("terminal:resize");
          socket.removeAllListeners("terminal:kill");
          socket.removeAllListeners("fs:list");
          socket.removeAllListeners("fs:read");
          socket.removeAllListeners("fs:write");

          socket.on("terminal:create", (tid) => {
             console.log(`[Proxy] Client -> Agent: terminal:create ${tid}`);
             containerSocket.emit("terminal:create", tid);
          });
          socket.on("terminal:input", (payload) => containerSocket.emit("terminal:input", payload));
          socket.on("terminal:resize", (payload) => containerSocket.emit("terminal:resize", payload));
          socket.on("terminal:kill", (tid) => containerSocket.emit("terminal:kill", tid));
          socket.on("fs:list", (dir) => containerSocket.emit("fs:list", dir));
          socket.on("fs:read", (p) => containerSocket.emit("fs:read", p));
          socket.on("fs:write", (p) => containerSocket.emit("fs:write", p));

        } catch (error: any) {
          console.error(`[Proxy] Workspace join failed:`, error.message);
          socket.emit("workspace:error", error.message);
        }
      });

      socket.on("disconnect", async () => {
        try {
          const ts = new Date().toISOString();
          await produceUserPresence({ userId, isOnline: false, lastOnlineAt: ts });
          io.emit("presence:update", { userId, isOnline: false, lastOnlineAt: ts });
        } catch (e) {
          console.error("Failed to produce presence (leave)", e);
        }
      });
    });

    sub.on("message", (channel, message) => {
      if (channel === "MESSAGES") {
        io.emit("event:message", JSON.parse(message));
      }
    });
  }

  get io() {
    return this._io;
  }
}
