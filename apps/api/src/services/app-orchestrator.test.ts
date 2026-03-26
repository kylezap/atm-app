import { describe, expect, it, vi } from "vitest";

import { createAtmOrchestrator } from "./app-orchestrator";
import type { PinService } from "./pin-service";
import type { WithdrawalService } from "./withdrawal-service";

describe("createAtmOrchestrator", () => {
  it("uses the withdrawal sequence result for ending balance and remaining notes", async () => {
    const withdrawals = [140, 50, 90];
    const pinService: PinService = {
      authenticate: vi.fn().mockResolvedValue({ currentBalance: 220 }),
      resetAuthentication: vi.fn(),
      setCurrentBalance: vi.fn(),
      getRecentTransactions: vi.fn().mockReturnValue([
        {
          amount: 140,
          status: "success",
          dispensedNotes: { 5: 4, 10: 4, 20: 4 },
          balanceBefore: 220,
          balanceAfter: 80,
          overdraftWarning: false,
          remainingNotes: { 5: 0, 10: 11, 20: 3 },
        },
      ]),
      recordTransaction: vi.fn(),
    };
    const withdrawalService: WithdrawalService = {
      processSequence: vi.fn().mockResolvedValue({
        withdrawals: [
          {
            amount: 140,
            status: "success",
            dispensedNotes: { 5: 4, 10: 4, 20: 4 },
            balanceBefore: 220,
            balanceAfter: 80,
            overdraftWarning: false,
            remainingNotes: { 5: 0, 10: 11, 20: 3 },
          },
        ],
        endingBalance: 80,
        remainingNotes: { 5: 0, 10: 11, 20: 3 },
      }),
    };

    const orchestrator = createAtmOrchestrator({
      pinService,
      withdrawalService,
    });

    const summary = await orchestrator.processSession({ pin: "1111", withdrawals });

    expect(summary.startingBalance).toBe(220);
    expect(summary.endingBalance).toBe(80);
    expect(summary.remainingNotes).toEqual({ 5: 0, 10: 11, 20: 3 });
    expect(summary.recentTransactions).toEqual([
      {
        amount: 140,
        status: "success",
        dispensedNotes: { 5: 4, 10: 4, 20: 4 },
        balanceBefore: 220,
        balanceAfter: 80,
        overdraftWarning: false,
        remainingNotes: { 5: 0, 10: 11, 20: 3 },
      },
    ]);
    expect(summary.withdrawals).toHaveLength(1);
    expect(withdrawalService.processSequence).toHaveBeenCalledWith(220, withdrawals);
    expect(pinService.recordTransaction).toHaveBeenCalledWith({
      amount: 140,
      status: "success",
      dispensedNotes: { 5: 4, 10: 4, 20: 4 },
      balanceBefore: 220,
      balanceAfter: 80,
      overdraftWarning: false,
      remainingNotes: { 5: 0, 10: 11, 20: 3 },
    });
    expect(pinService.setCurrentBalance).toHaveBeenCalledWith(80);
  });
});
