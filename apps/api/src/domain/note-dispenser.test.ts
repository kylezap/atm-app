import { describe, expect, it } from "vitest";

import { createNoteDispenser } from "./note-dispenser";

describe("createNoteDispenser", () => {
  it("prefers the most even exact combination", () => {
    const dispenser = createNoteDispenser();

    const notes = dispenser.selectNotes(50, { 5: 4, 10: 15, 20: 7 });

    expect(notes).toEqual({ 5: 2, 10: 2, 20: 1 });
  });

  it("returns the same combination for the same input", () => {
    const dispenser = createNoteDispenser();
    const availableNotes = { 5: 4, 10: 15, 20: 7 };

    expect(dispenser.selectNotes(50, availableNotes)).toEqual(
      dispenser.selectNotes(50, availableNotes),
    );
  });

  it("returns null when the amount cannot be dispensed exactly", () => {
    const dispenser = createNoteDispenser();

    expect(dispenser.selectNotes(15, { 5: 0, 10: 15, 20: 7 })).toBeNull();
  });
});
