import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";

// 1. Create the Connect Account
export const createConnectedAccount = async (userId: string, email: string) => {
  // Check if they already have one
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.stripeAccountId) return user.stripeAccountId;

  // Create an "Express" account on Stripe
  const account = await stripe.accounts.create({
    type: "express",
    email: email,
    capabilities: {
      transfers: { requested: true }, // We need this to send them money
    },
    business_type: "individual",
  });

  // Save the ID to your database
  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });

  return account.id;
};

// 2. Generate the Onboarding Link
export const getAccountLink = async (accountId: string) => {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: "http://localhost:3000/withdraw", // If they click back/refresh
    return_url: "http://localhost:3000/withdraw?setup=success", // Where they go after finishing
    type: "account_onboarding",
  });

  return accountLink.url;
};