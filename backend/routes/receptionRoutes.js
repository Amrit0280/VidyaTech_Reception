import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createReceptionAdmission,
  createReceptionCertificate,
  createReceptionNotification,
  createReceptionPayment,
  createReceptionStudent,
  deleteReceptionStudent,
  getReceptionSnapshot,
  resetReceptionPassword,
  searchReception,
  upsertReceptionStudentDocument
} from "../controllers/receptionController.js";

const router = Router();
const officeRoles = ["admin", "super_admin", "principal", "receptionist", "accountant", "finance"];

router.use(authenticate);
router.get("/snapshot", authorize(...officeRoles), asyncHandler(getReceptionSnapshot));
router.get("/search", authorize(...officeRoles), asyncHandler(searchReception));
router.post("/students", authorize("admin", "super_admin", "receptionist"), asyncHandler(createReceptionStudent));
router.delete("/students/:studentId", authorize("admin", "super_admin"), asyncHandler(deleteReceptionStudent));
router.post("/students/:studentId/documents", authorize("admin", "super_admin", "receptionist"), asyncHandler(upsertReceptionStudentDocument));
router.post("/payments", authorize("admin", "accountant", "finance"), asyncHandler(createReceptionPayment));
router.post("/credentials/reset", authorize("admin", "super_admin", "receptionist"), asyncHandler(resetReceptionPassword));
router.post("/notifications", authorize("admin", "super_admin", "receptionist"), asyncHandler(createReceptionNotification));
router.post("/admissions", authorize("admin", "super_admin", "receptionist"), asyncHandler(createReceptionAdmission));
router.post("/certificates", authorize("admin", "super_admin", "receptionist"), asyncHandler(createReceptionCertificate));

export default router;
