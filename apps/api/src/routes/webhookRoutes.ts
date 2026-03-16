import express from "express";
import { stripeWebhook } from "../controllers/webhookController";

const router = express.Router();

router.post("/", stripeWebhook);

export default router;
