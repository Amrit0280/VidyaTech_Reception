import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { demoCredentials, login, me } from "../controllers/authController.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));
router.get("/demo-credentials", demoCredentials);

export default router;
