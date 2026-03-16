import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { processRefund } from "../services/walletService";

export const startEscrowCron = () => {
  // This cron expression "0 * * * *" means: Run at minute 0 of every hour.
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Sweeping for expired escrow transactions...");

    try {
      // 1. Find all PENDING transactions where the clock has run out
      const expiredTransactions = await prisma.transaction.findMany({
        where: {
          status: "PENDING_CLAIM",
          expiresAt: {
            lte: new Date(), // lte = "less than or equal to" right now
          },
        },
      });

      if (expiredTransactions.length === 0) return;

      console.log(`[CRON] Found ${expiredTransactions.length} expired transactions. Refunding...`);

      // 2. Process refunds for each one
      for (const tx of expiredTransactions) {
        try {
          // Pass "EXPIRED", and omit the userId since the system is doing this
          await processRefund(tx.id, "EXPIRED");
          console.log(`[CRON] Successfully refunded TX: ${tx.id}`);
          
          // Optional: Clear the sender's Redis cache here so their balance updates!
          
        } catch (err) {
          console.error(`[CRON] Failed to refund TX: ${tx.id}`, err);
          // We continue to the next one even if one fails
        }
      }
    } catch (error) {
      console.error("[CRON] Database error during escrow sweep:", error);
    }
  });
};