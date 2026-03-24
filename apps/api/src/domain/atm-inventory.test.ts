import { describe, expect, it } from "vitest";

import { createInitialInventory } from "./atm-inventory";

describe("createInitialInventory", () => {
  it("deducts notes from the in-memory inventory", () => {
    const inventory = createInitialInventory();

    inventory.deductNotes({ 5: 1, 10: 2, 20: 3 });

    expect(inventory.getRemainingNotes()).toEqual({ 5: 3, 10: 13, 20: 4 });
  });

  it("throws when deducting more notes than remain", () => {
    const inventory = createInitialInventory();

    expect(() =>
      inventory.deductNotes({ 5: 5, 10: 0, 20: 0 }),
    ).toThrowError("Cannot deduct 5 notes of 5.");
  });
});
