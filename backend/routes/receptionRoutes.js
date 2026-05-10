import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createReceptionAdmission,
  createReceptionNotification,
  createReceptionPayment,
  createReceptionStudent,
  getReceptionSnapshot,
  resetReceptionPassword,
  searchReception
} from "../controllers/receptionController.js";

const router = Router();
const officeRoles = ["admin", "receptionist", "accountant", "finance"];

router.use(authenticate);
router.get("/snapshot", authorize(...officeRoles), asyncHandler(getReceptionSnapshot));
router.get("/search", authorize(...officeRoles), asyncHandler(searchReception));
router.post("/students", authorize("admin", "receptionist"), asyncHandler(createReceptionStudent));
router.post("/payments", authorize("admin", "accountant", "finance"), asyncHandler(createReceptionPayment));
router.post("/credentials/reset", authorize("admin", "receptionist"), asyncHandler(resetReceptionPassword));
router.post("/notifications", authorize("admin", "receptionist"), asyncHandler(createReceptionNotification));
router.post("/admissions", authorize("admin", "receptionist"), asyncHandler(createReceptionAdmission));

export default router;
