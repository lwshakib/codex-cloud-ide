import { Router } from "express";
import workspaceRoutes from "./workspace.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/workspaces", workspaceRoutes);
router.use("/user", userRoutes);

export default router;

