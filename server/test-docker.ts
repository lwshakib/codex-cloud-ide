import Docker from "dockerode";

console.log("Platform:", process.platform);

process.env.DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine';
console.log("DOCKER_HOST set to:", process.env.DOCKER_HOST);

const docker = new Docker();

async function test() {
  try {
    console.log("Calling docker.version()...");
    const version = await docker.version();
    console.log("Docker Version:", version.Version);
  } catch (err: any) {
    console.error("Docker Connection Failed:", err);
  }
}

test();
