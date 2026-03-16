import express from "express";
import { createPayment } from "../controllers/paymentController";
import { auth } from "../middleware/auth";

const router = express.Router();

router.post("/create", auth, createPayment);

export default router;
