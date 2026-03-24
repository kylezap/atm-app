import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionReceipt } from "./SessionReceipt";

describe("SessionReceipt", () => {
  it("renders successful withdrawal details", () => {
    render(
      <SessionReceipt
        result={{
          amount: 20,
          status: "success",
          dispensedNotes: { 5: 0, 10: 0, 20: 1 },
          balanceBefore: -20,
          balanceAfter: -40,
          overdraftWarning: true,
          remainingNotes: { 5: 4, 10: 15, 20: 6 },
        }}
      />,
    );

    expect(screen.getByText("Dispensed")).toBeInTheDocument();
    expect(screen.getByText(/£20 to -£40/)).toHaveClass("receipt-panel__balance--negative");
    expect(screen.getByText(/account remains in overdraft after this withdrawal/i)).toBeInTheDocument();
  });

  it("renders failed withdrawal details", () => {
    render(
      <SessionReceipt
        result={{
          amount: 40,
          status: "failed",
          reason: "INSUFFICIENT_NOTES",
        }}
      />,
    );

    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(
      screen.getByText("The machine cannot make this amount exactly with the notes left."),
    ).toBeInTheDocument();
  });
});
