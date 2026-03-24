import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransactionHistoryList } from "./TransactionHistoryList";

describe("TransactionHistoryList", () => {
  it("renders an empty-state helper", () => {
    render(<TransactionHistoryList entries={[]} />);

    expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  });

  it("renders history rows", () => {
    render(
      <TransactionHistoryList
        entries={[
          {
            id: "success-40-180-0",
            label: "£40 dispensed",
            detail: "Balance now £180",
            tone: "success",
          },
        ]}
      />,
    );

    expect(screen.getByText("Previous transactions")).toBeInTheDocument();
    expect(screen.getByText("£40 dispensed")).toBeInTheDocument();
    expect(screen.getByText("Balance now £180")).toBeInTheDocument();
  });
});
