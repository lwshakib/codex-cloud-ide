import { Router } from "express";
import { prisma } from "../services/prisma.services";
import { auth } from "../services/auth.services";
const router = Router();

// Middleware to check authentication
const authenticate = async (req: any, res: any, next: any) => {
  const session = await auth.api.getSession({ headers: req.headers });
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
  try {
    await prisma.workspace.delete({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete workspace" });
  }
});

export default router;
