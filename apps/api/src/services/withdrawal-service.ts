import { OVERDRAFT_LIMIT } from "@atm/shared";
import type {
  FailedWithdrawalResult,
  NoteCounts,
  SuccessfulWithdrawalResult,
  WithdrawalResult,
} from "@atm/shared";

import type { AtmInventory } from "../domain/atm-inventory";
import type { NoteDispenser } from "../domain/note-dispenser";
import type { WithdrawalSequenceResult } from "../types/atm";

export interface WithdrawalService {
  processSequence(
    balance: number,
    withdrawals: number[],
  ): Promise<WithdrawalSequenceResult>;
}

interface CreateWithdrawalServiceOptions {
  inventory: AtmInventory;
  noteDispenser: NoteDispenser;
}

function createEmptyNotes(): NoteCounts {
  return { 5: 0, 10: 0, 20: 0 };
}

export function createWithdrawalService(
  options: CreateWithdrawalServiceOptions,
): WithdrawalService {
  return {
    async processSequence(balance: number, withdrawals: number[]) {
      const results: WithdrawalResult[] = [];
      let currentBalance = balance;

      for (const amount of withdrawals) {
        const balanceAfter = currentBalance - amount;

        if (balanceAfter < -OVERDRAFT_LIMIT) {
          results.push({
            amount,
            status: "failed",
            reason: "OVERDRAFT_LIMIT_EXCEEDED",
          } satisfies FailedWithdrawalResult);
          break;
        }

        const availableNotes = options.inventory.getRemainingNotes();
        const dispensedNotes = options.noteDispenser.selectNotes(amount, availableNotes);

        if (!dispensedNotes) {
          results.push({
            amount,
            status: "failed",
            reason: "INSUFFICIENT_NOTES",
          } satisfies FailedWithdrawalResult);
          break;
        }

        options.inventory.deductNotes(dispensedNotes);
        currentBalance = balanceAfter;

        results.push({
          amount,
          status: "success",
          dispensedNotes,
          balanceBefore: currentBalance + amount,
          balanceAfter: currentBalance,
          overdraftWarning: currentBalance < 0,
          remainingNotes: options.inventory.getRemainingNotes(),
        } satisfies SuccessfulWithdrawalResult);
      }

      return {
        withdrawals: results,
        endingBalance: currentBalance,
        remainingNotes: options.inventory.getRemainingNotes(),
      };
    },
  };
}