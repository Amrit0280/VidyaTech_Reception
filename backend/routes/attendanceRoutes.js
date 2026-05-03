import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { listAttendance, uploadAttendance } from "../controllers/attendanceController.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin", "teacher", "parent", "student"), asyncHandler(listAttendance));
router.post("/", authorize("admin", "teacher"), asyncHandler(uploadAttendance));

export default router;
