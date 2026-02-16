import Docker from "dockerode";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const isWindows = process.platform === "win32";
// Try default socket/pipe paths
const docker = new Docker(isWindows ? { socketPath: "\\\\.\\pipe\\docker_engine" } : undefined);

class DockerService {
  private static instance: DockerService;
  private imageBuilt = false;

  private constructor() {}

  public static getInstance(): DockerService {
    if (!DockerService.instance) {
      DockerService.instance = new DockerService();
    }
    return DockerService.instance;
  }

  private async runCli(command: string): Promise<string> {
      try {
          return execSync(command, { encoding: "utf8" });
      } catch (error: any) {
          console.error(`CLI Command failed: ${command}`, error.message);
          throw error;
      }
  }

  public async buildWorkingImage() {
    if (this.imageBuilt) return;
    
    try {
        const images = await this.runCli("docker images --format {{.Repository}} codex-working-container");
        if (images.includes("codex-working-container")) {
            this.imageBuilt = true;
            return;
        }
    } catch (e) {
        // ignore
    }

    console.log("Image codex-working-container not found. Attempting to build...");
    const dockerfilePath = path.resolve(__dirname, "../../../working-container");
    try {
        this.runCli(`docker build -t codex-working-container ${dockerfilePath}`);
        this.imageBuilt = true;
    } catch (e) {
        console.error("Failed to build image via CLI");
    }
  }

  public async createContainer(workspaceId: string) {
    const containerName = `workspace-${workspaceId}`;
    const volumeName = `vol-${workspaceId}`;

    // Ensure image is built
    await this.buildWorkingImage();

    // Check if container already exists
    try {
        const existingId = await this.runCli(`docker ps -a --filter name=^/${containerName}$ --format {{.ID}}`);
        if (existingId.trim()) {
            console.log(`[Docker] Found existing container ${containerName} (${existingId.trim()})`);
            const status = await this.runCli(`docker ps -a --filter name=^/${containerName}$ --format {{.Status}}`);
            if (!status.toLowerCase().includes("up")) {
                console.log(`[Docker] Starting stopped container ${containerName}...`);
                await this.runCli(`docker start ${containerName}`);
            }
            return docker.getContainer(containerName);
        }
    } catch (e) {
        console.warn(`[Docker] Error checking for existing container:`, e);
    }

    console.log(`[Docker] Creating fresh container for workspace: ${containerName}`);
    try {
        // Create volume if not exists
        try {
            await this.runCli(`docker volume create ${volumeName}`);
        } catch (e) {}

        // Expose 3001 (agent), 3000 (standard app), 5173 (Vite)
        // Using -v for persistence across container recreations
        const cmd = `docker run -d \
            --name ${containerName} \
            --network app-network \
            -v ${volumeName}:/workspace \
            -p 0:3001 -p 0:3000 -p 0:5173 \
            -e WORKSPACE_ID=${workspaceId} \
            -e NODE_ENV=development \
            codex-working-container`;
        
        await this.runCli(cmd);
        console.log(`[Docker] Container ${containerName} created successfully.`);
        return docker.getContainer(containerName);
    } catch (error: any) {
        console.error(`[Docker] Critical failure creating container ${containerName}:`, error.message);
        throw error;
    }
  }

  public async stopContainer(workspaceId: string) {
      const containerName = `workspace-${workspaceId}`;
      const volumeName = `vol-${workspaceId}`;
      try {
          console.log(`[Docker] Stopping and removing container ${containerName}...`);
          await this.runCli(`docker stop ${containerName}`);
          await this.runCli(`docker rm ${containerName}`);
          console.log(`[Docker] Removing volume ${volumeName}...`);
          await this.runCli(`docker volume rm ${volumeName}`);
      } catch (e: any) {
          console.error(`[Docker] Cleanup failed for ${containerName}:`, e.message);
      }
  }

  public async getContainerInfo(workspaceId: string) {
      const containerName = `workspace-${workspaceId}`;
      try {
          const info = await this.runCli(`docker inspect ${containerName}`);
          return JSON.parse(info)[0];
      } catch (e) {
          return null;
      }
  }
}

export default DockerService.getInstance();

