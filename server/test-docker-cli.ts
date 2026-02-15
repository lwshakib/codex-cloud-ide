import { spawnSync } from "child_process";

const result = spawnSync("docker", ["version", "--format", "{{.Server.Version}}"], { encoding: "utf8" });
if (result.error) {
    console.error("Error running docker CLI:", result.error);
} else {
    console.log("Docker Version via CLI:", result.stdout.trim());
}
