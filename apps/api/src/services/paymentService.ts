import { stripe } from "../lib/stripe";

export const createCheckoutSession = async (
  amount: number,
  userId: string
) => {
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Wallet Top-up" },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],

    metadata: { userId,  amount: String(amount) },
  });
};
