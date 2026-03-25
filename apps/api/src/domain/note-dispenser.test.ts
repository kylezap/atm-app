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

  it("respects inventory limits when choosing the best combination", () => {
    const dispenser = createNoteDispenser();

    // Ideal combo for $50 is {20:1, 10:2, 5:2} but no $5s are available,
    // so it falls back to the next best exact combo: {20:2, 10:1, 5:0} (spread 2)
    const notes = dispenser.selectNotes(50, { 5: 0, 10: 15, 20: 7 });

    expect(notes).toEqual({ 5: 0, 10: 1, 20: 2 });
  });

  it("achieves perfect spread of zero when possible — $140 with initial note counts", () => {
    const dispenser = createNoteDispenser();

    // 4×$20 + 4×$10 + 4×$5 = $140, all counts equal, spread=0
    const notes = dispenser.selectNotes(140, { 5: 4, 10: 15, 20: 7 });

    expect(notes).toEqual({ 5: 4, 10: 4, 20: 4 });
  });

  it("finds the minimum-spread combination — $90 with initial note counts", () => {
    const dispenser = createNoteDispenser();

    // 3×$20 + 2×$10 + 2×$5 = $90 is the unique spread-1 solution
    const notes = dispenser.selectNotes(90, { 5: 4, 10: 15, 20: 7 });

    expect(notes).toEqual({ 5: 2, 10: 2, 20: 3 });
  });

  it("handles an amount expressible with only a single denomination", () => {
    const dispenser = createNoteDispenser();

    const notes = dispenser.selectNotes(20, { 5: 0, 10: 0, 20: 5 });

    expect(notes).toEqual({ 5: 0, 10: 0, 20: 1 });
  });
});
