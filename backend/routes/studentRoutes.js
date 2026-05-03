import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createStudent, deleteStudent, listStudents, updateStudent } from "../controllers/studentController.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin", "teacher", "finance"), asyncHandler(listStudents));
router.post("/", authorize("admin"), asyncHandler(createStudent));
router.patch("/:id", authorize("admin"), asyncHandler(updateStudent));
router.delete("/:id", authorize("admin"), asyncHandler(deleteStudent));

export default router;
