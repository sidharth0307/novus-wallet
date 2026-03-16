import { Request, Response } from "express";
import { registerUser, loginUser, getUserProfile } from "../services/authService";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body.email, req.body.password);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Registration failed" });
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