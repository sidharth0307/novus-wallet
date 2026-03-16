import { z } from "zod";

export const transferSchema = z.object({
  email: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
  idempotencyKey: z.string(),
});

export const withdrawSchema = z.object({
  amount: z.number().positive("Withdrawal amount must be greater than 0"),
});