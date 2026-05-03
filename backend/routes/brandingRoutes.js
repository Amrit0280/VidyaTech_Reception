import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { getBranding, updateBranding } from "../controllers/brandingController.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin"), asyncHandler(getBranding));
router.patch("/", authorize("admin"), asyncHandler(updateBranding));

export default router;
