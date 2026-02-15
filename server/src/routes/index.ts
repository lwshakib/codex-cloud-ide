import { Router } from "express";
import workspaceRoutes from "./workspace.routes";

const router = Router();

router.use("/workspaces", workspaceRoutes);

export default router;
