import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { createLead } from "../controllers/leadController.js";

const router = Router();

router.post("/", asyncHandler(createLead));

export default router;
