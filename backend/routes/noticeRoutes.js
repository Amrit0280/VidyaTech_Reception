import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createNotice, listNotices } from "../controllers/noticeController.js";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(listNotices));
router.post("/", authorize("admin", "teacher"), asyncHandler(createNotice));

export default router;
