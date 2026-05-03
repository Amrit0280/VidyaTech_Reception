import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { overview } from "../controllers/analyticsController.js";

const router = Router();

router.use(authenticate);
router.get("/overview", authorize("admin", "finance"), asyncHandler(overview));

export default router;
