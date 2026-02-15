import app from "./app.js";
import "dotenv/config";
import logger from "./logger/winston.logger.js";

async function startServer() {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}

startServer();
