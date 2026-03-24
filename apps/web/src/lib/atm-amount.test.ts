import { describe, expect, it } from "vitest";

import {
  getCustomAmountHelper,
  getNearestAmountSuggestions,
  isSupportedCustomAmount,
  sanitizeDigits,
} from "./atm-amount";

describe("atm-amount", () => {
  it("sanitizes numeric input to the requested max length", () => {
    expect(sanitizeDigits("12a34")).toBe("1234");
    expect(sanitizeDigits("abc12345", 3)).toBe("123");
  });

  it("validates supported custom amounts", () => {
    expect(isSupportedCustomAmount(20)).toBe(true);
    expect(isSupportedCustomAmount(0)).toBe(false);
    expect(isSupportedCustomAmount(23)).toBe(false);
  });

  it("returns nearest valid suggestions for unsupported values", () => {
    expect(getNearestAmountSuggestions(23)).toEqual([20, 25]);
    expect(getNearestAmountSuggestions(-5)).toEqual([5, 10]);
  });

  it("builds helper copy for empty, invalid, and valid values", () => {
    expect(getCustomAmountHelper("")).toBe("Enter a custom amount in increments of £5.");
    expect(getCustomAmountHelper("0")).toBe("Enter a whole-pound amount greater than zero.");
    expect(getCustomAmountHelper("23")).toBe(
      "This machine dispenses in £5 steps. Try £20 or £25.",
    );
    expect(getCustomAmountHelper("40")).toBe(
      "The ATM will validate balance and note availability when the session runs.",
    );
  });
});
