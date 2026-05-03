import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { listResults, uploadResult } from "../controllers/resultController.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin", "teacher", "parent", "student"), asyncHandler(listResults));
router.post("/", authorize("admin", "teacher"), asyncHandler(uploadResult));

export default router;
