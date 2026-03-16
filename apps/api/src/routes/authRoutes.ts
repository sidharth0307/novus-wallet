import express from "express";
import { register, login, profile } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "@wallet/schemas";
import { auth } from "../middleware/auth";
import { ipRateLimit, rateLimit } from "../middleware/rateLimit";

const router = express.Router();

router.post("/register", ipRateLimit, validate(registerSchema), register);
router.post("/login", ipRateLimit, validate(loginSchema), login);
router.get("/profile", auth, rateLimit, profile);

export default router;
