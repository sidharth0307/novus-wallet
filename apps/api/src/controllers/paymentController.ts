import { Request, Response } from "express";
import { createCheckoutSession } from "../services/paymentService";

export const createPayment = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { amount } = req.body;
    const userId = req.user.userId; 

    const session = await createCheckoutSession(amount, userId);
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Payment failed" });
  }
};