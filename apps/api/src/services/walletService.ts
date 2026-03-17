import { TransactionStatus, TransactionType } from "../generated/prisma";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { stripe } from "../lib/stripe";
import { cacheAside } from "../utils/cache";
import crypto from 'crypto';
import { sendClaimEmail } from "../utils/email";

export const transferMoney = async (
  fromUserId: string,
  receiverIdentifier: string, 
  amount: number,
  description?: string,
  idempotencyKey?: string
) => {
  if (!fromUserId) throw new Error("Missing fromUserId");
  if (!receiverIdentifier) throw new Error("Missing receiver info");
  if (amount <= 0) throw new Error("Invalid amount");
  if (!idempotencyKey) throw new Error("Idempotency key is required");

  // DETECTION: Is it an email or a cashtag?
  const isEmail = receiverIdentifier.includes("@");
  
  // Sanitize based on what they typed
  const cleanIdentifier = isEmail 
    ? receiverIdentifier.toLowerCase() 
    : receiverIdentifier.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Declare this outside the transaction so our cache clearer can use it later
  let receiverUserId: string | null = null;

  const result = await prisma.$transaction(async (tx) => {
    
    // 1. Idempotency Check
    const existingTransaction = await tx.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existingTransaction) return existingTransaction;

    // 2. Fetch Sender
    const senderWallet = await tx.wallet.findUnique({ where: { userId: fromUserId } });
    if (!senderWallet) throw new Error("Sender wallet not found");

    // 3. LOOKUP: Find by Email OR Cashtag
    const receiverUser = await tx.user.findUnique({
      where: isEmail ? { email: cleanIdentifier } : { cashtag: cleanIdentifier },
      include: { wallet: true },
    });

    if (receiverUser && receiverUser.id === fromUserId) {
      throw new Error("Cannot transfer to yourself");
    }

    // 4. The Guarded Debit
    const debit = await tx.wallet.updateMany({
      where: { userId: fromUserId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debit.count === 0) throw new Error("Insufficient funds");

    // ---------------------------------------------------------
    // BRANCH A: REGISTERED USER (Instant Transfer)
    // ---------------------------------------------------------
    if (receiverUser && receiverUser.wallet) {
      
      receiverUserId = receiverUser.id; // Save the ID for Redis later

      await tx.wallet.update({
        where: { userId: receiverUser.id },
        data: { balance: { increment: amount } },
      });

      return await tx.transaction.create({
        data: {
          amount,
          type: "TRANSFER",
          status: "SUCCESS",
          currency: "USD",
          fromWalletId: senderWallet.id,
          toWalletId: receiverUser.wallet.id,
          description,
          idempotencyKey,
          entries: {
            create: [
              { amount, type: "DEBIT", walletId: senderWallet.id },
              { amount, type: "CREDIT", walletId: receiverUser.wallet.id }
            ]
          }
        },
      });
    } 
    
    // ---------------------------------------------------------
    // BRANCH B: UNREGISTERED USER (Escrow / Pending Claim)
    // ---------------------------------------------------------
    else {
      // Logic Check: We cannot escrow to a Cashtag because we have no way to email them a claim link!
      if (!isEmail) {
        throw new Error(`Cashtag $${cleanIdentifier} does not exist.`);
      }

      const claimToken = crypto.randomUUID();

      // Calculate 7 days from right now
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      return await tx.transaction.create({
        data: {
          amount,
          type: "TRANSFER",
          status: "PENDING_CLAIM", 
          currency: "USD",
          fromWalletId: senderWallet.id,
          recipientEmail: cleanIdentifier, // We know it's an email here
          claimToken: claimToken, 
          expiresAt: expirationDate,  // Set an expiration for the claim link     
          description,
          idempotencyKey,
          entries: {
            create: [
              { amount, type: "DEBIT", walletId: senderWallet.id }
            ]
          }
        },
      });
    }
  });

  // Delete caches (Using the safely scoped receiverUserId)
  const keys = [`wallet:${fromUserId}`, `tx:${fromUserId}`];
  if (result.status === "SUCCESS" && receiverUserId) {
    keys.push(`wallet:${receiverUserId}`, `tx:${receiverUserId}`);
  }
  if (typeof redis !== 'undefined') await redis.del(...keys);

  // Trigger Escrow Email
  if (result.status === "PENDING_CLAIM" && result.recipientEmail && result.claimToken) {
    sendClaimEmail(result.recipientEmail, amount, result.claimToken).catch(err => {
      console.error("Non-fatal email error:", err);
    });
  }

  return result;
};

export const getWalletBalance = async (userId: string) => {
  return cacheAside<number>(`wallet:${userId}`, 60, async () => {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error("Wallet not found");
    return wallet.balance ?? 0;
  });
};

export const getTx = async (
  userId: string,
  options?: { cursor?: string; limit?: number; type?: TransactionType }
) => {
  const { cursor, limit = 10, type } = options || {};

  // Get user's wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!wallet) throw new Error("Wallet not found");

  // Fetch transactions with cursor pagination
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ fromWalletId: wallet.id }, { toWalletId: wallet.id }],
      ...(type && { type }),
    },
    include: {
      fromWallet: { select: { user: { select: { email: true, id: true } } } },
      toWallet: { select: { user: { select: { email: true, id: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  // Determine next cursor
  let nextCursor: string | null = null;
  if (transactions.length > limit) {
    const nextItem = transactions.pop();
    nextCursor = nextItem!.id;
  }

  const formatted = transactions.map((tx) => {
    const direction = tx.fromWalletId === wallet.id ? "OUT" : "IN";

    return {
      id: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type,
      status: tx.status,
      description: tx.description,
      createdAt: tx.createdAt,
      direction,
      fromUser: tx.fromWallet?.user
        ? { id: tx.fromWallet.user.id, email: tx.fromWallet.user.email }
        : null,
      toUser: tx.toWallet?.user
        ? { id: tx.toWallet.user.id, email: tx.toWallet.user.email }
        : null,
    };
  });

  return { transactions: formatted, nextCursor };
};


export const withdrawMoney = async (
  userId: string, 
  amount: number,
  idempotencyKey?: string // 1. idempotency key protection
) => {
  if (!userId) throw new Error("Missing userId");
  if (amount <= 0) throw new Error("Invalid amount");

  // 1. Ensure the user has a Stripe Connect account
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeAccountId) {
    throw new Error("STRIPE_ACCOUNT_MISSING"); 
  }
  const stripeAccountId = user.stripeAccountId;

  const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);
  if (!stripeAccount.details_submitted) {
    throw new Error("STRIPE_ONBOARDING_INCOMPLETE");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Idempotency check to prevent double-withdrawals
    if (idempotencyKey) {
      const existingTx = await tx.transaction.findUnique({ where: { idempotencyKey } });
      if (existingTx) return existingTx;
    }

    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error("Wallet not found");

    // 2. Guarded debit in Postgres
    const debit = await tx.wallet.updateMany({
      where: { userId: userId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debit.count === 0) throw new Error("Insufficient funds");

    // 3. STRIPE TRANSFER
    try {
      await stripe.transfers.create({
        amount: amount, // in cents
        currency: "usd",
        destination: stripeAccountId,
        description: `Withdrawal from Novus Wallet`,
      });
    } catch (stripeError: any) {
      console.error("Stripe Transfer Failed:", stripeError);
      throw new Error(`Stripe Error: ${stripeError.message}`);
    }

    // 4. Create the receipt AND the Immutable Ledger Entry
    return await tx.transaction.create({
      data: {
        amount,
        type: TransactionType.WITHDRAW,
        status: TransactionStatus.SUCCESS,
        currency: "USD",
        fromWalletId: wallet.id,
        toWalletId: null,
        description: "Stripe Connect Payout",
        idempotencyKey, // Store the lock
        
        entries: {
          create: [
            {
              amount,
              type: "DEBIT", 
              walletId: wallet.id,
            }
          ]
        }
      },
    });
  });

  const keys = [`wallet:${userId}`, `tx:${userId}`];
  if (typeof redis !== 'undefined') await redis.del(...keys);

  return result;
};


export const claimEscrowFunds = async (userId: string, claimToken: string) => {
  if (!userId) throw new Error("Missing user ID");
  if (!claimToken) throw new Error("Missing claim token");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Find the pending transaction using the secret token
    const pendingTx = await tx.transaction.findFirst({
      where: { claimToken },
    });

    if (!pendingTx) throw new Error("Invalid or expired claim link");
    if (pendingTx.status !== "PENDING_CLAIM") throw new Error("These funds have already been claimed");

    // 2. Get the new user's wallet
    const newWallet = await tx.wallet.findUnique({ where: { userId } });
    if (!newWallet) throw new Error("Wallet not found for the new user");

    // 3. Add the Escrowed money to their new wallet
    await tx.wallet.update({
      where: { id: newWallet.id },
      data: { balance: { increment: pendingTx.amount } },
    });

    // 4. Update the Transaction to SUCCESS and link it to their wallet
    const completedTx = await tx.transaction.update({
      where: { id: pendingTx.id },
      data: {
        status: "SUCCESS",
        toWalletId: newWallet.id,
      },
    });

    // 5. Write the single CREDIT receipt to balance the ledger
    await tx.ledgerEntry.create({
      data: {
        amount: pendingTx.amount,
        type: "CREDIT",
        walletId: newWallet.id,
        transactionId: pendingTx.id, // Link it to the original transfer
      }
    });

    return completedTx;
  });

  // Clear the new user's cache so they immediately see the money
  if (typeof redis !== 'undefined') await redis.del(`wallet:${userId}`, `tx:${userId}`);

  return result;
};


export const getUserByCashtag = async (cashtag: string) => {
  if (!cashtag) throw new Error("Cashtag is required");

  let formattedCashtag = cashtag.toLowerCase().replace(/[^a-z0-9$]/g, "");

  if (!formattedCashtag.startsWith("$")) {
    formattedCashtag = "$" + formattedCashtag;
  }

  const user = await prisma.user.findUnique({
    where: { cashtag: formattedCashtag },
    select: { 
      id: true, 
      cashtag: true, 
    },
  });

  return user;
};


export const processRefund = async (transactionId: string, reason: "CANCELLED" | "EXPIRED", requestingUserId?: string) => {
  return await prisma.$transaction(async (tx) => {
    const pendingTx = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { fromWallet: true }
    });

    if (!pendingTx) throw new Error("Transaction not found");
    if (pendingTx.status !== "PENDING_CLAIM") throw new Error("This transfer cannot be refunded.");
    
    if (!pendingTx.fromWallet || !pendingTx.fromWalletId) {
      throw new Error("Critical Error: Original sender wallet not found.");
    }
    
    if (requestingUserId && pendingTx.fromWallet.userId !== requestingUserId) {
      throw new Error("Unauthorized to cancel this transfer");
    }

    // 1. Update the transaction status
    const refundedTx = await tx.transaction.update({
      where: { id: transactionId },
      data: { 
        status: reason,
        claimToken: null // Destroy the claim token so it can never be used
      } 
    });

    // 2. Give the money back to the sender
    await tx.wallet.update({
      where: { id: pendingTx.fromWalletId },
      data: { balance: { increment: pendingTx.amount } }
    });

    // 3. Write the Refund Receipt to balance the ledger
    await tx.ledgerEntry.create({
      data: {
        amount: pendingTx.amount,
        type: "CREDIT", // Money coming BACK IN
        walletId: pendingTx.fromWalletId,
        transactionId: pendingTx.id,
      }
    });

    return refundedTx;
  });
};