import express from "express";
import { register, login, profile, verifyOtp, forgotPasswordRequest, passwordResetConfirm } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "@wallet/schemas";
import { auth } from "../middleware/auth";
import { ipRateLimit, rateLimit } from "../middleware/rateLimit";

const router = express.Router();

router.post("/register", ipRateLimit, validate(registerSchema), register);
router.post("/verify-otp", ipRateLimit, verifyOtp);
router.post("/login", ipRateLimit, validate(loginSchema), login);
router.post("/forgot-password", ipRateLimit, forgotPasswordRequest);
router.post("/reset-password", ipRateLimit, passwordResetConfirm);
router.get("/profile", auth, rateLimit, profile);

export default router;
