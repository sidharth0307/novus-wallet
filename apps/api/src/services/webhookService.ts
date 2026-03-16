import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis"; 

export const handleCheckoutCompleted = async (session: any) => {
  const eventId = session.id; 
  const userId = session.metadata.userId;
  const amount = Number(session.metadata.amount);

  try {
    // Wrap EVERYTHING in a single transaction
    await prisma.$transaction(async (tx) => {
      
      // 1. Enforce Idempotency via Database Constraint
      await tx.webhookEvent.create({
        data: { providerEventId: eventId },
      });

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

      // 2. Update Balance (The Fast Cache)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      // 3. Record Transaction AND the Immutable Ledger Entry
      await tx.transaction.create({
        data: {
          type: "DEPOSIT",
          status: "SUCCESS",
          amount,
          toWalletId: wallet.id,
          description: "Stripe deposit",
          stripeSessionId: session.id,
          
          entries: {
            create: [
              {
                amount,
                type: "CREDIT",
                walletId: wallet.id, // Money enters the user's wallet
              }
            ]
          }
        },
      });
    });

    // 4. CLEAR THE CACHE!
    await redis.del(`wallet:${userId}`, `tx:${userId}`);

    console.log("Deposit processed seamlessly for user:", userId);

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log("Ignored duplicate Stripe webhook:", eventId);
      return; 
    }
    console.error("Critical Webhook Error:", error);
    throw error;
  }
};