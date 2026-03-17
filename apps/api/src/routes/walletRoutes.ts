import express from "express";
import { balance, cancelTransfer, claimFunds, lookupCashtag, setupPayouts, transactions, transfer, withdraw } from "../controllers/walletController";
import { validate } from "../middleware/validate";
import { transferSchema, withdrawSchema } from "@wallet/schemas";
import { auth } from "../middleware/auth";
import { rateLimit, strictRateLimit } from "../middleware/rateLimit";

const router = express.Router();
// --- DATA FETCHING (Uses generous 60/min limit) ---
router.get("/balance", auth, rateLimit, balance);
router.get("/transactions", auth, rateLimit, transactions);
router.get("/lookup/:cashtag", rateLimit, lookupCashtag);

// --- FINANCIAL ACTIONS (Uses strict 10/min limit) ---
router.post("/transfer", auth, strictRateLimit, validate(transferSchema), transfer);
router.post("/withdraw", auth, strictRateLimit, validate(withdrawSchema), withdraw);
router.post("/payout-setup", auth, strictRateLimit, setupPayouts);
router.post("/claim", auth, strictRateLimit, claimFunds);
router.post("/transfer/:id/cancel", auth, strictRateLimit, cancelTransfer);

export default router;
