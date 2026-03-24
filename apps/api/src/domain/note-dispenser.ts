import type { NoteCounts } from "@atm/shared";

export interface NoteDispenser {
  selectNotes(amount: number, availableNotes: NoteCounts): NoteCounts | null;
}

export function createNoteDispenser(): NoteDispenser {
  return {
    selectNotes(_amount: number, _availableNotes: NoteCounts) {
      return null;
    },
  };
}
