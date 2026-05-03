import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createSalary, listSalaries, markSalaryPaid } from "../controllers/salaryController.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin", "finance"), asyncHandler(listSalaries));
router.post("/", authorize("admin", "finance"), asyncHandler(createSalary));
router.patch("/:id/paid", authorize("admin", "finance"), asyncHandler(markSalaryPaid));

export default router;
