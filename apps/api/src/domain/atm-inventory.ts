import { INITIAL_NOTE_COUNTS } from "@atm/shared";
import type { NoteCounts } from "@atm/shared";

export interface AtmInventory {
  getRemainingNotes(): NoteCounts;
  deductNotes(notes: NoteCounts): void;
}

export function createInitialInventory(): AtmInventory {
  const remainingNotes: NoteCounts = {
    5: INITIAL_NOTE_COUNTS[5],
    10: INITIAL_NOTE_COUNTS[10],
    20: INITIAL_NOTE_COUNTS[20],
  };

  return {
    getRemainingNotes() {
      return { ...remainingNotes };
    },
    deductNotes(notes: NoteCounts) {
      for (const denomination of [20, 10, 5] as const) {
        if (notes[denomination] > remainingNotes[denomination]) {
          throw new Error(
            `Cannot deduct ${notes[denomination]} notes of ${denomination}.`,
          );
        }
      }

      for (const denomination of [20, 10, 5] as const) {
        remainingNotes[denomination] -= notes[denomination];
      }
    },
  };
}
