import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AtmPage } from "./AtmPage";

const successSummary = {
  authenticated: true,
  startingBalance: 220,
  withdrawals: [
    {
      amount: 40,
      status: "success" as const,
      dispensedNotes: { 5: 0, 10: 0, 20: 2 },
      balanceBefore: 220,
      balanceAfter: 180,
      overdraftWarning: false,
      remainingNotes: { 5: 4, 10: 15, 20: 5 },
    },
  ],
  endingBalance: 180,
  remainingNotes: { 5: 4, 10: 15, 20: 5 },
  recentTransactions: [
    {
      amount: 40,
      status: "success" as const,
      dispensedNotes: { 5: 0, 10: 0, 20: 2 },
      balanceBefore: 220,
      balanceAfter: 180,
      overdraftWarning: false,
      remainingNotes: { 5: 4, 10: 15, 20: 5 },
    },
  ],
};

const overdraftSummary = {
  authenticated: true,
  startingBalance: -20,
  withdrawals: [
    {
      amount: 20,
      status: "success" as const,
      dispensedNotes: { 5: 0, 10: 0, 20: 1 },
      balanceBefore: -20,
      balanceAfter: -40,
      overdraftWarning: true,
      remainingNotes: { 5: 4, 10: 15, 20: 6 },
    },
  ],
  endingBalance: -40,
  remainingNotes: { 5: 4, 10: 15, 20: 6 },
  recentTransactions: [
    {
      amount: 20,
      status: "success" as const,
      dispensedNotes: { 5: 0, 10: 0, 20: 1 },
      balanceBefore: -20,
      balanceAfter: -40,
      overdraftWarning: true,
      remainingNotes: { 5: 4, 10: 15, 20: 6 },
    },
  ],
};

async function findMainMenuHeading() {
  return screen.findByRole(
    "heading",
    { name: /choose a service/i, level: 2 },
    { timeout: 4000 },
  );
}

describe("AtmPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("guides the user through a single ATM withdrawal and updates the balance", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          currentBalance: 220,
          recentTransactions: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => successSummary,
      } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    expect(screen.queryByText(/^previous transactions$/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: /start session/i }));
    expect(screen.queryByText(/^previous transactions$/i)).toBeNull();
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/atm/pin",
        expect.objectContaining({
          body: JSON.stringify({ pin: "1111" }),
          method: "POST",
        }),
      ),
    );

    expect(await screen.findByRole("heading", { name: /pin verified/i, level: 2 })).toBeInTheDocument();
    expect(await findMainMenuHeading()).toBeInTheDocument();
    expect(screen.getByText(/^current balance$/i)).toBeInTheDocument();
    expect(screen.getByText("£220")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /quick cash/i })).toBeInTheDocument();
    expect(screen.queryByText(/session sequence/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: /quick cash/i }));
    await user.click(screen.getByRole("button", { name: "£40" }));
    await user.click(screen.getByRole("button", { name: /confirm amount/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/atm/session",
        expect.objectContaining({
          body: JSON.stringify({ pin: "1111", withdrawals: [40] }),
          method: "POST",
        }),
      ),
    );

    await screen.findByRole("heading", { name: /cash dispensed/i, level: 2 });
    await user.click(screen.getByRole("button", { name: /finish session/i }));

    expect(
      await screen.findByRole("heading", { name: /atm session complete/i, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("£180")).toBeInTheDocument();
    expect(screen.getAllByText(/^previous transactions$/i).length).toBeGreaterThan(0);
    expect(screen.getByText("£40 dispensed")).toBeInTheDocument();
    expect(screen.getByText("Balance now £180")).toBeInTheDocument();
  });

  it("returns to the main menu from the success screen", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          currentBalance: 220,
          recentTransactions: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => successSummary,
      } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    await user.click(screen.getByRole("button", { name: /start session/i }));
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    await findMainMenuHeading();

    await user.click(screen.getByRole("button", { name: /quick cash/i }));
    await user.click(screen.getByRole("button", { name: "£40" }));
    await user.click(screen.getByRole("button", { name: /confirm amount/i }));

    await screen.findByRole("heading", { name: /cash dispensed/i, level: 2 });
    await user.click(screen.getByRole("button", { name: /main menu/i }));

    expect(
      await findMainMenuHeading(),
    ).toBeInTheDocument();
    expect(screen.getByText("£180")).toBeInTheDocument();
    expect(screen.getAllByText(/^previous transactions$/i).length).toBeGreaterThan(0);
    expect(screen.getByText("£40 dispensed")).toBeInTheDocument();
  });

  it("shows the balance screen from the home menu and returns back", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        currentBalance: 220,
        recentTransactions: [],
      }),
    } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    await user.click(screen.getByRole("button", { name: /start session/i }));
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    await findMainMenuHeading();
    await user.click(screen.getByRole("button", { name: /see current balance/i }));

    expect(await screen.findByRole("heading", { name: /current balance/i, level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText("£220")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /back to main menu/i }));

    expect(await findMainMenuHeading()).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows previous transactions from the main menu", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        currentBalance: 180,
        recentTransactions: successSummary.recentTransactions,
      }),
    } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    await user.click(screen.getByRole("button", { name: /start session/i }));
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    await findMainMenuHeading();
    await user.click(screen.getByRole("button", { name: /previous transactions/i }));

    expect(
      await screen.findByRole("heading", { name: /previous transactions/i, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("£40 dispensed")).toBeInTheDocument();
    expect(screen.getByText("Balance now £180")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to main menu/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("opens custom amount from the home menu", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        currentBalance: 220,
        recentTransactions: [],
      }),
    } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    await user.click(screen.getByRole("button", { name: /start session/i }));
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    await findMainMenuHeading();
    await user.click(screen.getByRole("button", { name: /custom amount/i }));

    expect(
      await screen.findByRole("heading", { name: /enter your withdrawal amount/i, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to main menu/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("warns before submitting an overdraft withdrawal and highlights a negative balance", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          currentBalance: -20,
          recentTransactions: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => overdraftSummary,
      } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    await user.click(screen.getByRole("button", { name: /start session/i }));
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    const negativeBalance = await screen.findByText("-£20");
    expect(negativeBalance).toHaveClass("atm-balance-value--negative");

    await findMainMenuHeading();
    await user.click(screen.getByRole("button", { name: /quick cash/i }));
    await user.click(screen.getByRole("button", { name: "£20" }));
    await user.click(screen.getByRole("button", { name: /confirm amount/i }));

    expect(
      await screen.findByRole("heading", {
        name: /this withdrawal will put the account into overdraft/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /yes, continue/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/atm/session",
        expect.objectContaining({
          body: JSON.stringify({ pin: "1111", withdrawals: [20] }),
          method: "POST",
        }),
      ),
    );

    expect(await screen.findByText("-£40")).toHaveClass("atm-balance-value--negative");
    expect(screen.getByText(/account remains in overdraft after this withdrawal/i)).toBeInTheDocument();
  });

  it("blocks the user on the PIN screen when immediate verification fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Invalid PIN." }),
    } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    await user.click(screen.getByRole("button", { name: /start session/i }));
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("heading", { name: /enter your 4-digit pin/i, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Invalid PIN.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /choose your withdrawal amount/i, level: 2 })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("restores previous transactions after a refresh and fresh login", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        currentBalance: 180,
        recentTransactions: successSummary.recentTransactions,
      }),
    } as Response);

    const user = userEvent.setup();
    render(<AtmPage />);

    await user.click(screen.getByRole("button", { name: /start session/i }));
    await user.type(screen.getByLabelText(/pin code/i), "1111");
    await user.keyboard("{Enter}");

    expect(await findMainMenuHeading()).toBeInTheDocument();
    expect(screen.getByText(/^current balance$/i)).toBeInTheDocument();
    expect(screen.getByText("£180")).toBeInTheDocument();
    expect(screen.getAllByText(/^previous transactions$/i).length).toBeGreaterThan(0);
    expect(screen.getByText("£40 dispensed")).toBeInTheDocument();
    expect(screen.getByText("Balance now £180")).toBeInTheDocument();
  });
});
