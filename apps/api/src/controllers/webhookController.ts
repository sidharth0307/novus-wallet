import { stripe } from "../lib/stripe";
import { handleCheckoutCompleted } from "../services/webhookService";
import { Request, Response } from "express";

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return res.status(400).send(`Webhook Signature Error`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object);
    }
    // Only return 200 IF the database transaction succeeded
    res.json({ received: true });
  } catch (err) {
    // Return a 500 so Stripe knows to RETRY this event later
    res.status(500).json({ error: "Internal processing error" });
  }
};
