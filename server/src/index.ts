import httpServer from "./app";

import "dotenv/config";
import logger from "./logger/winston.logger";
import SocketService from "./services/socket.services";

async function startServer() {
  const port = process.env.PORT || 4000;
  
  const socketService = new SocketService();
  socketService.io.attach(httpServer);
  socketService.initListeners();

  // Ensure Docker image is built
  try {
    const DockerService = (await import("./services/docker.services")).default;
    await DockerService.buildWorkingImage();
    console.log("Docker image check/build completed.");
  } catch (err) {
    console.error("Failed to ensure Docker image:", err);
  }


  httpServer.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}
startServer();

