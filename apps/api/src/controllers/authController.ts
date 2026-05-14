import { Request, Response } from "express";
import {  loginUser, getUserProfile, initiateRegistration, verifyUserOtp, resetPassword, requestPasswordReset } from "../services/authService";

export const register = async (req: Request, res: Response) => {
  try {
    const result = await initiateRegistration(req.body.email, req.body.password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
};

// Route: POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const result = await verifyUserOtp(req.body.email, req.body.otp);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Verification failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const token = await loginUser(req.body.email, req.body.password);
    res.json({ token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Invalid credentials" });
  }
};

export const forgotPasswordRequest = async (req: Request, res: Response) => {
  try {
    const result = await requestPasswordReset(req.body.email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const passwordResetConfirm = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await resetPassword(email, otp, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const profile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  try {
    const profile = await getUserProfile(req.user.userId);
    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to load profile"});
  }
};