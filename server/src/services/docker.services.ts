import Docker from "dockerode";
import path from "path";
import fs from "fs";

const docker = new Docker(); // Defaults to /var/run/docker.sock or //./pipe/docker_engine on Windows

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

  public async buildWorkingImage() {
    if (this.imageBuilt) return;

    const dockerfilePath = path.resolve(__dirname, "../../../working-container");
    console.log("Building working-container image from:", dockerfilePath);

    // This is a simplified build process. In production, you'd use a more robust way.
    // Dockerode build expect a tar stream.
    // For now, let's assume the image 'codex-working-container' is built or will be built.
    // Usually we would run: docker build -t codex-working-container ./working-container
    
    // Check if image exists
    const images = await docker.listImages();
    const exists = images.some(img => img.RepoTags?.includes("codex-working-container:latest"));
    
    if (exists) {
        this.imageBuilt = true;
        return;
    }

    console.log("Image codex-working-container not found. Please build it manually or use this service to build it.");
    // Building via dockerode is complex with streams, so let's just use a shell command for simplicity if possible.
  }

  public async createContainer(workspaceId: string) {
    const containerName = `workspace-${workspaceId}`;

    // Check if container already exists
    try {
        const existing = docker.getContainer(containerName);
        await existing.inspect();
        return existing;
    } catch (e) {
        // Container doesn't exist, proceed to create
    }

    const container = await docker.createContainer({
      Image: "codex-working-container",
      name: containerName,
      ExposedPorts: {
        "3001/tcp": {}
      },
      HostConfig: {
        PortBindings: {
          "3001/tcp": [{ HostPort: "0" }] // Random port or we manage them
        },
        NetworkMode: "app-network"
      },
      Env: [
          `WORKSPACE_ID=${workspaceId}`
      ]
    });

    await container.start();
    return container;
  }

  public async stopContainer(workspaceId: string) {
      const containerName = `workspace-${workspaceId}`;
      try {
          const container = docker.getContainer(containerName);
          await container.stop();
          await container.remove();
      } catch (e) {
          console.error(`Failed to stop container ${containerName}:`, e);
      }
  }

  public async getContainerInfo(workspaceId: string) {
      const containerName = `workspace-${workspaceId}`;
      try {
          const container = docker.getContainer(containerName);
          const data = await container.inspect();
          return data;
      } catch (e) {
          return null;
      }
  }
}

export default DockerService.getInstance();
