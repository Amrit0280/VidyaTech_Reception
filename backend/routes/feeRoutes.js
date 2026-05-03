import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createFee, createPaymentOrder, listFees, markFeePaid } from "../controllers/feeController.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin", "finance", "parent", "student"), asyncHandler(listFees));
router.post("/", authorize("admin", "finance"), asyncHandler(createFee));
router.post("/payment-order", authorize("admin", "finance", "parent", "student"), asyncHandler(createPaymentOrder));
router.patch("/:id/paid", authorize("admin", "finance"), asyncHandler(markFeePaid));

export default router;
