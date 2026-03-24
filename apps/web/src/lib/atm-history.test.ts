import { describe, expect, it } from "vitest";

import { createTransactionHistoryEntry, mapTransactionHistory } from "./atm-history";

describe("atm-history", () => {
  it("maps successful withdrawals to stable transaction history entries", () => {
    const entry = createTransactionHistoryEntry(
      {
        amount: 40,
        status: "success",
        dispensedNotes: { 5: 0, 10: 0, 20: 2 },
        balanceBefore: 220,
        balanceAfter: 180,
        overdraftWarning: false,
        remainingNotes: { 5: 4, 10: 15, 20: 5 },
      },
      0,
    );

    expect(entry).toEqual({
      id: "success-40-180-0",
      label: "£40 dispensed",
      detail: "Balance now £180",
      tone: "success",
    });
  });

  it("maps failed withdrawals to stable transaction history entries", () => {
    const entry = createTransactionHistoryEntry(
      {
        amount: 40,
        status: "failed",
        reason: "INSUFFICIENT_NOTES",
      },
      1,
    );

    expect(entry).toEqual({
      id: "failed-40-INSUFFICIENT_NOTES-1",
      label: "£40 rejected",
      detail: "The machine cannot make this amount exactly with the notes left.",
      tone: "failed",
    });
  });

  it("maps result lists in order", () => {
    const entries = mapTransactionHistory([
      {
        amount: 20,
        status: "success",
        dispensedNotes: { 5: 0, 10: 0, 20: 1 },
        balanceBefore: 220,
        balanceAfter: 200,
        overdraftWarning: false,
        remainingNotes: { 5: 4, 10: 15, 20: 6 },
      },
      {
        amount: 90,
        status: "failed",
        reason: "INSUFFICIENT_NOTES",
      },
    ]);

    expect(entries.map((entry) => entry.id)).toEqual([
      "success-20-200-0",
      "failed-90-INSUFFICIENT_NOTES-1",
    ]);
  });
});
