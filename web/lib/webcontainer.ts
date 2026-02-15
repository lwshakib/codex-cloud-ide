import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let activeWorkspaceId: string | null = null;

export async function getWebContainerInstance(id?: string) {
  // If we have an instance but it's for a different workspace, tear it down first
  if (webcontainerInstance && id && activeWorkspaceId && id !== activeWorkspaceId) {
    await teardownWebContainer();
  }

  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  if (bootPromise) {
    return bootPromise;
  }
  
  const workdirName = id ? `vibe-ws-${id}` : 'vibe-project';
  activeWorkspaceId = id || null;
  
  bootPromise = WebContainer.boot({
    coep: 'credentialless', 
    workdirName
  }).then((instance) => {
    webcontainerInstance = instance;
    return instance;
  });
  return bootPromise;
}

export async function teardownWebContainer() {
  if (webcontainerInstance) {
    try {
      webcontainerInstance.teardown();
    } catch (e) {
      // console.error("WebContainer teardown error:", e);
    }
  }
  webcontainerInstance = null;
  bootPromise = null;
  activeWorkspaceId = null;
}
