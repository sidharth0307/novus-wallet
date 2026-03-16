import { Request, Response } from "express";
import { claimEscrowFunds, getTx, getUserByCashtag, getWalletBalance, processRefund, transferMoney, withdrawMoney } from "../services/walletService";
import { TransactionType } from "../generated/prisma";
import { prisma } from "../lib/prisma";
import { createConnectedAccount, getAccountLink } from "../services/stripeConnectService";
import { redis } from "../lib/redis";

export const transfer = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { email, cashtag, amount, description, idempotencyKey } = req.body;
    
    const receiverIdentifier = email || cashtag;

    if (!receiverIdentifier) {
      return res.status(400).json({ message: "Missing receiver email or cashtag" });
    }

    const tx = await transferMoney(
      req.user.userId, 
      receiverIdentifier, 
      Number(amount), 
      description, 
      idempotencyKey
    );
    
    res.json(tx);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Transfer failed" });
  }
};

export const balance = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  try {
    const bal = await getWalletBalance(req.user.userId);
    res.json({ balance: bal });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const transactions = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { cursor, limit, type } = req.query;
    const tx = await getTx(req.user.userId, {
      cursor: typeof cursor === "string" ? cursor : undefined,
      limit: limit ? Number(limit) : undefined,
      type: type as TransactionType,
    });
    res.json(tx);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const withdraw = async (req: Request, res: Response) => {
 
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { amount } = req.body;

    const tx = await withdrawMoney(req.user.userId, Number(amount));
    
    res.json(tx);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Withdrawal failed" });
  }
};

export const setupPayouts = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  try {
    // 1. Get the user's email for Stripe Connect
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 2. Create a Stripe Connected Account and get the onboarding link
    const accountId = await createConnectedAccount(user.id, user.email);
    const url = await getAccountLink(accountId);

    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to initialize bank setup" });
  }
};


export const claimFunds = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  try {    
    const { claimToken } = req.body;
    const userId = req.user.userId;

    if (!claimToken) return res.status(400).json({ message: "Claim token is required" });

    const completedTx = await claimEscrowFunds(userId, claimToken);

    res.status(200).json({
      message: "Funds claimed successfully",
      transaction: completedTx,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to claim funds" });
  }
};

export const lookupCashtag = async (req: Request, res: Response) => {
  try {
    let { cashtag } = req.params;

    if (Array.isArray(cashtag)) {
      cashtag = cashtag[0];
    }
   
    if (!cashtag || typeof cashtag !== "string") {
      return res.status(400).json({ error: "Valid cashtag is required" });
    }

    const user = await getUserByCashtag(cashtag);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const cancelTransfer = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    let { id } = req.params;
    
    if (Array.isArray(id)) {
      id = id[0];
    }
    
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Valid transaction ID is required" });
    }
    const refundedTx = await processRefund(id, "CANCELLED", req.user.userId);
    if (typeof redis !== 'undefined') {
      await redis.del(`wallet:${req.user.userId}`);
      await redis.del(`tx:${req.user.userId}`);
    }
    res.json({ message: "Transfer cancelled and refunded", transaction: refundedTx });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Failed to cancel transfer" });
  }
};