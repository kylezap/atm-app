import { z } from "zod";

import { ERROR_CODES } from "../constants/atm";

export const pinRequestSchema = z.object({
  pin: z.string().min(1),
  withdrawals: z.array(z.number().int().positive()).min(1),
});

export const pinVerificationRequestSchema = z.object({
  pin: z.string().min(1),
});

export const pinApiSuccessResponseSchema = z.object({
  currentBalance: z.number(),
});

export const pinVerificationResultSchema = z.object({
  authenticated: z.literal(true),
  currentBalance: z.number(),
  recentTransactions: z.array(z.lazy(() => withdrawalResultSchema)),
});

export const noteCountsSchema = z.object({
  5: z.number().int().nonnegative(),
  10: z.number().int().nonnegative(),
  20: z.number().int().nonnegative(),
});

export const successfulWithdrawalResultSchema = z.object({
  amount: z.number().positive(),
  status: z.literal("success"),
  dispensedNotes: noteCountsSchema,
  balanceBefore: z.number().int(),
  balanceAfter: z.number().int(),
  overdraftWarning: z.boolean(),
  remainingNotes: noteCountsSchema,
});

export const failedWithdrawalResultSchema = z.object({
  amount: z.number().positive(),
  status: z.literal("failed"),
  reason: z.enum(ERROR_CODES),
});

export const withdrawalResultSchema = z.union([
  successfulWithdrawalResultSchema,
  failedWithdrawalResultSchema,
]);

export const recentTransactionsSchema = z.array(withdrawalResultSchema);

export const atmSessionSummarySchema = z.object({
  authenticated: z.boolean(),
  startingBalance: z.number().int(),
  withdrawals: z.array(withdrawalResultSchema),
  endingBalance: z.number().int(),
  remainingNotes: noteCountsSchema,
  recentTransactions: recentTransactionsSchema,
});
