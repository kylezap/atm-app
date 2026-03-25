import { SUPPORTED_DENOMINATIONS } from "@atm/shared";
import type { NoteCounts } from "@atm/shared";

// This module is responsible for selecting the best combination of notes to dispense for a given amount.
// It is used to ensure that the ATM dispenses the correct amount of notes and that the notes are as evenly distributed as possible.

function createEmptyNotes(): NoteCounts {
  return { 5: 0, 10: 0, 20: 0 };
}

function getSpread(notes: NoteCounts) {
  const counts = SUPPORTED_DENOMINATIONS.map((denomination) => notes[denomination]);
  return Math.max(...counts) - Math.min(...counts);
}

function getTotalNotes(notes: NoteCounts) {
  return SUPPORTED_DENOMINATIONS.reduce(
    (total, denomination) => total + notes[denomination],
    0,
  );
}

function compareByLargestDenomination(a: NoteCounts, b: NoteCounts) {
  for (const denomination of SUPPORTED_DENOMINATIONS) {
    if (a[denomination] !== b[denomination]) {
      return b[denomination] - a[denomination];
    }
  }

  return 0;
}

function compareCombinations(a: NoteCounts, b: NoteCounts) {
  const spreadDifference = getSpread(a) - getSpread(b);

  if (spreadDifference !== 0) {
    return spreadDifference;
  }

  const totalNotesDifference = getTotalNotes(a) - getTotalNotes(b);

  if (totalNotesDifference !== 0) {
    return totalNotesDifference;
  }

  return compareByLargestDenomination(a, b);
}

function buildCombinations(
  amount: number,
  availableNotes: NoteCounts,
  denominationIndex: number,
  currentNotes: NoteCounts,
  combinations: NoteCounts[],
) {
  if (denominationIndex === SUPPORTED_DENOMINATIONS.length - 1) {
    const denomination = SUPPORTED_DENOMINATIONS[denominationIndex];

    if (
      amount % denomination === 0 &&
      amount / denomination <= availableNotes[denomination]
    ) {
      combinations.push({
        ...currentNotes,
        [denomination]: amount / denomination,
      });
    }

    return;
  }

  const denomination = SUPPORTED_DENOMINATIONS[denominationIndex];
  const maxCount = Math.min(
    availableNotes[denomination],
    Math.floor(amount / denomination),
  );

  for (let count = 0; count <= maxCount; count += 1) {
    buildCombinations(
      amount - count * denomination,
      availableNotes,
      denominationIndex + 1,
      {
        ...currentNotes,
        [denomination]: count,
      },
      combinations,
    );
  }
}

function getAllExactCombinations(amount: number, availableNotes: NoteCounts) {
  const combinations: NoteCounts[] = [];

  buildCombinations(
    amount,
    availableNotes,
    0,
    createEmptyNotes(),
    combinations,
  );

  return combinations;
}

export interface NoteDispenser {
  selectNotes(amount: number, availableNotes: NoteCounts): NoteCounts | null;
}

export function createNoteDispenser(): NoteDispenser {
  return {
    selectNotes(amount: number, availableNotes: NoteCounts) {
      const exactCombinations = getAllExactCombinations(amount, availableNotes);

      if (exactCombinations.length === 0) {
        return null;
      }

      const [bestCombination] = [...exactCombinations].sort(compareCombinations);

      return { ...bestCombination };
    },
  };
}
