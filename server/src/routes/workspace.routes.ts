import { Router } from "express";
import { prisma } from "../services/prisma.services";
import { auth } from "../services/auth.services";
import { fromNodeHeaders } from "better-auth/node";
const router = Router();

// Middleware to check authentication
const authenticate = async (req: any, res: any, next: any) => {
  const session = await auth.api.getSession({ 
    headers: fromNodeHeaders(req.headers) 
  });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = session.user;
  next();
};

// Get all workspaces for the logged in user
router.get("/", authenticate, async (req: any, res: any) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
});

// Create a new workspace
router.post("/", authenticate, async (req: any, res: any) => {
  const { name, app_type, files } = req.body;
  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: name || "Untitled Workspace",
        app_type: app_type || "VITE_APP",
        files: files || {},
        userId: req.user.id,
      },
    });

    // Spin up container right away
    try {
        const DockerService = (await import("../services/docker.services")).default;
        await DockerService.createContainer(workspace.id);
        console.log(`Container created for workspace ${workspace.id}`);
    } catch (dockerError) {
        console.error("Failed to spin up container on creation:", dockerError);
        // We don't fail the whole request since the DB part succeeded
    }

    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: "Failed to create workspace" });
  }
});


// Get a single workspace
router.get("/:id", authenticate, async (req: any, res: any) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.id, userId: req.user.id },
      include: { messages: true },
    });
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workspace" });
  }
});

// Update a workspace
router.patch("/:id", authenticate, async (req: any, res: any) => {
  const { name, files } = req.body;
  try {
    const workspace = await prisma.workspace.update({
      where: { id: req.params.id, userId: req.user.id },
      data: {
        ...(name && { name }),
        ...(files && { files }),
      },
    });
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: "Failed to update workspace" });
  }
});

// Delete a workspace
router.delete("/:id", authenticate, async (req: any, res: any) => {
  const workspaceId = req.params.id;
  try {
    await prisma.workspace.delete({
      where: { id: workspaceId, userId: req.user.id },
    });

    // Clean up container
    try {
        const DockerService = (await import("../services/docker.services")).default;
        await DockerService.stopContainer(workspaceId);
        console.log(`Container removed for workspace ${workspaceId}`);
    } catch (dockerError) {
        console.error("Failed to stop/remove container on deletion:", dockerError);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete workspace" });
  }
});

export default router;
