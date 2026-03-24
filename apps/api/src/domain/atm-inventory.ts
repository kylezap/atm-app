import { INITIAL_NOTE_COUNTS } from "@atm/shared";
import type { NoteCounts } from "@atm/shared";

export interface AtmInventory {
  getRemainingNotes(): NoteCounts;
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
  };
}
