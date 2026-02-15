import JSZip from "jszip";
import { log } from "./logger";

/**
 * Downloads a project as a ZIP file.
 * 
 * @param projectName - The name of the project to be used as the filename.
 * @param files - A record of file paths and their contents.
 */
export const downloadProjectAsZip = async (
  projectName: string,
  files: Record<string, { content: string }>
) => {
  try {
    log(`Starting download for project: ${projectName}`, "info");
    log("Initializing ZIP generation...", "info");
    const zip = new JSZip();

    Object.entries(files).forEach(([path, { content }]) => {
      // Ensure directories are created as well if the path contains slashes
      // jszip's zip.file("path/to/file", content) automatically handles intermediate directories
      zip.file(path, content); 
      log(`Adding file: ${path}`, "debug");
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, "_").toLowerCase() || "project"}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
    log("Download complete and object URL revoked.", "info");
  } catch (error) {
    log(`Failed to download project: ${error instanceof Error ? error.message : String(error)}`, "error");
    throw error;
  }
};



