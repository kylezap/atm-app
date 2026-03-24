import { describe, expect, it } from "vitest";

import { formatCurrency, formatFailureReason } from "./atm-format";

describe("atm-format", () => {
  it("formats pound amounts without decimals", () => {
    expect(formatCurrency(220)).toBe("£220");
    expect(formatCurrency(-40)).toBe("-£40");
  });

  it("maps failure codes to user-facing messages", () => {
    expect(formatFailureReason("INVALID_PIN")).toBe("Invalid PIN.");
    expect(formatFailureReason("PIN_API_ERROR")).toBe(
      "The ATM could not reach the PIN service.",
    );
    expect(formatFailureReason("INVALID_PIN_RESPONSE")).toBe(
      "The PIN service returned an unreadable balance.",
    );
    expect(formatFailureReason("OVERDRAFT_LIMIT_EXCEEDED")).toBe(
      "This withdrawal exceeds the overdraft floor.",
    );
    expect(formatFailureReason("INSUFFICIENT_NOTES")).toBe(
      "The machine cannot make this amount exactly with the notes left.",
    );
  });
});
