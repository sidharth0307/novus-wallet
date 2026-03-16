import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/authRoutes";
import walletRoutes from "./routes/walletRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import { startEscrowCron } from "./utils/escrowCron";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  "/webhook", 
  bodyParser.raw({ type: "application/json" }), 
  webhookRoutes
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/wallet", walletRoutes);
app.use("/payment", paymentRoutes);

app.get("/", (_, res) => {
  res.send("API Running");
});

startEscrowCron();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});