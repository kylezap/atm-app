import type {
  NoteCounts,
  SuccessfulWithdrawalResult,
  WithdrawalResult,
} from "@atm/shared";

import type { AtmInventory } from "../domain/atm-inventory";
import type { NoteDispenser } from "../domain/note-dispenser";
import { NotImplementedError } from "../lib/http-error";

export interface WithdrawalService {
  processSequence(balance: number, withdrawals: number[]): Promise<WithdrawalResult[]>;
}

interface CreateWithdrawalServiceOptions {
  inventory: AtmInventory;
  noteDispenser: NoteDispenser;
}

function createEmptyNotes(): NoteCounts {
  return { 5: 0, 10: 0, 20: 0 };
}

function createPlaceholderSuccess(balance: number): SuccessfulWithdrawalResult {
  return {
    amount: 0,
    status: "success",
    dispensedNotes: createEmptyNotes(),
    balanceBefore: balance,
    balanceAfter: balance,
    overdraftWarning: false,
    remainingNotes: createEmptyNotes(),
  };
}

export function createWithdrawalService(
  options: CreateWithdrawalServiceOptions,
): WithdrawalService {
  return {
    async processSequence(balance: number, _withdrawals: number[]) {
      options.inventory.getRemainingNotes();
      options.noteDispenser.selectNotes(0, createEmptyNotes());
      createPlaceholderSuccess(balance);

      throw new NotImplementedError(
        "Withdrawal processing has not been implemented yet.",
      );
    },
  };
}
