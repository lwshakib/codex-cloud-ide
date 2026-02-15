import { Router } from "express";
import { healthCheck, rootHandler } from "../controllers/health.controllers.js";

const router = Router();

router.route("/").get(rootHandler);
router.route("/health").get(healthCheck);

export default router;
