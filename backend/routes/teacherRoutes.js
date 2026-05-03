import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createTeacher, listTeachers } from "../controllers/teacherController.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin"), asyncHandler(listTeachers));
router.post("/", authorize("admin"), asyncHandler(createTeacher));

export default router;
