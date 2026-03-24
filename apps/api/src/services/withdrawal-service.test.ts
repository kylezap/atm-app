import { describe, expect, it } from "vitest";

import { createInitialInventory } from "../domain/atm-inventory";
import { createNoteDispenser } from "../domain/note-dispenser";
import { createWithdrawalService } from "./withdrawal-service";

describe("createWithdrawalService", () => {
  it("processes the full runtime withdrawal sequence", async () => {
    const service = createWithdrawalService({
      inventory: createInitialInventory(),
      noteDispenser: createNoteDispenser(),
    });

    const result = await service.processSequence(220, [140, 50, 90]);

    expect(result.withdrawals).toEqual([
      {
        amount: 140,
        status: "success",
        dispensedNotes: { 5: 4, 10: 4, 20: 4 },
        balanceBefore: 220,
        balanceAfter: 80,
        overdraftWarning: false,
        remainingNotes: { 5: 0, 10: 11, 20: 3 },
      },
      {
        amount: 50,
        status: "success",
        dispensedNotes: { 5: 0, 10: 1, 20: 2 },
        balanceBefore: 80,
        balanceAfter: 30,
        overdraftWarning: false,
        remainingNotes: { 5: 0, 10: 10, 20: 1 },
      },
      {
        amount: 90,
        status: "success",
        dispensedNotes: { 5: 0, 10: 7, 20: 1 },
        balanceBefore: 30,
        balanceAfter: -60,
        overdraftWarning: true,
        remainingNotes: { 5: 0, 10: 3, 20: 0 },
      },
    ]);
    expect(result.endingBalance).toBe(-60);
    expect(result.remainingNotes).toEqual({ 5: 0, 10: 3, 20: 0 });
  });

  it("allows a withdrawal that lands exactly on the overdraft limit", async () => {
    const service = createWithdrawalService({
      inventory: createInitialInventory(),
      noteDispenser: createNoteDispenser(),
    });

    const result = await service.processSequence(40, [140]);

    expect(result.withdrawals).toEqual([
      {
        amount: 140,
        status: "success",
        dispensedNotes: { 5: 4, 10: 4, 20: 4 },
        balanceBefore: 40,
        balanceAfter: -100,
        overdraftWarning: true,
        remainingNotes: { 5: 0, 10: 11, 20: 3 },
      },
    ]);
    expect(result.endingBalance).toBe(-100);
  });

  it("fails when the overdraft limit would be exceeded", async () => {
    const service = createWithdrawalService({
      inventory: createInitialInventory(),
      noteDispenser: createNoteDispenser(),
    });

    const result = await service.processSequence(39, [140]);

    expect(result.withdrawals).toEqual([
      {
        amount: 140,
        status: "failed",
        reason: "OVERDRAFT_LIMIT_EXCEEDED",
      },
    ]);
    expect(result.endingBalance).toBe(39);
    expect(result.remainingNotes).toEqual({ 5: 4, 10: 15, 20: 7 });
  });

  it("stops processing after the first note-dispensing failure", async () => {
    const service = createWithdrawalService({
      inventory: createInitialInventory(),
      noteDispenser: createNoteDispenser(),
    });

    const result = await service.processSequence(220, [140, 15, 50]);

    expect(result.withdrawals).toEqual([
      {
        amount: 140,
        status: "success",
        dispensedNotes: { 5: 4, 10: 4, 20: 4 },
        balanceBefore: 220,
        balanceAfter: 80,
        overdraftWarning: false,
        remainingNotes: { 5: 0, 10: 11, 20: 3 },
      },
      {
        amount: 15,
        status: "failed",
        reason: "INSUFFICIENT_NOTES",
      },
    ]);
    expect(result.endingBalance).toBe(80);
    expect(result.remainingNotes).toEqual({ 5: 0, 10: 11, 20: 3 });
  });
});
