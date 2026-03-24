import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAtmFlow } from "./useAtmFlow";

const verifyPinMock = vi.fn();
const createAtmSessionMock = vi.fn();

vi.mock("../lib/api", () => ({
  verifyPin: (...args: unknown[]) => verifyPinMock(...args),
  createAtmSession: (...args: unknown[]) => createAtmSessionMock(...args),
}));

async function authenticate() {
  const hook = renderHook(() => useAtmFlow());

  act(() => {
    hook.result.current.startSession();
    hook.result.current.updatePin("1111");
  });

  await act(async () => {
    await hook.result.current.submitPin();
  });

  act(() => {
    hook.result.current.goHome();
  });

  return hook;
}

describe("useAtmFlow", () => {
  beforeEach(() => {
    verifyPinMock.mockReset();
    createAtmSessionMock.mockReset();
    vi.useRealTimers();
  });

  it("keeps invalid short PIN attempts on the PIN screen", async () => {
    const { result } = renderHook(() => useAtmFlow());

    act(() => {
      result.current.startSession();
      result.current.updatePin("11");
    });

    await act(async () => {
      await result.current.submitPin();
    });

    expect(result.current.screen).toBe("pin");
    expect(result.current.pinError).toBe("Enter the 4-digit demo PIN to continue.");
    expect(verifyPinMock).not.toHaveBeenCalled();
  });

  it("moves from pin success to the main menu after the timeout", async () => {
    vi.useFakeTimers();
    verifyPinMock.mockResolvedValue({
      authenticated: true,
      currentBalance: 220,
      recentTransactions: [],
    });

    const { result } = renderHook(() => useAtmFlow());

    act(() => {
      result.current.startSession();
      result.current.updatePin("1111");
    });

    await act(async () => {
      await result.current.submitPin();
    });

    expect(result.current.screen).toBe("pinSuccess");

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.screen).toBe("home");
  });

  it("shows validation feedback for unsupported custom amounts", async () => {
    verifyPinMock.mockResolvedValue({
      authenticated: true,
      currentBalance: 220,
      recentTransactions: [],
    });

    const hook = await authenticate();

    act(() => {
      hook.result.current.openCustomAmount();
    });

    act(() => {
      hook.result.current.updateCustomAmount("23");
    });

    act(() => {
      hook.result.current.reviewCustomAmount();
    });

    expect(hook.result.current.screen).toBe("customAmount");
    expect(hook.result.current.customAmountError).toBe(
      "This machine dispenses in £5 steps. Try £20 or £25.",
    );
  });

  it("requires overdraft confirmation before submitting the session", async () => {
    verifyPinMock.mockResolvedValue({
      authenticated: true,
      currentBalance: -20,
      recentTransactions: [],
    });
    createAtmSessionMock.mockResolvedValue({
      authenticated: true,
      startingBalance: -20,
      withdrawals: [
        {
          amount: 20,
          status: "success",
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
          status: "success",
          dispensedNotes: { 5: 0, 10: 0, 20: 1 },
          balanceBefore: -20,
          balanceAfter: -40,
          overdraftWarning: true,
          remainingNotes: { 5: 4, 10: 15, 20: 6 },
        },
      ],
    });

    const hook = await authenticate();

    act(() => {
      hook.result.current.openAmountSelection();
    });

    act(() => {
      hook.result.current.selectQuickAmount(20);
    });

    act(() => {
      hook.result.current.confirmAmount();
    });

    expect(hook.result.current.showOverdraftWarning).toBe(true);
    expect(createAtmSessionMock).not.toHaveBeenCalled();

    await act(async () => {
      hook.result.current.confirmOverdraft();
    });

    expect(createAtmSessionMock).toHaveBeenCalledWith("1111", [20]);
    expect(hook.result.current.screen).toBe("result");
    expect(hook.result.current.currentBalance).toBe(-40);
  });

  it("returns to the main menu and clears result state", async () => {
    verifyPinMock.mockResolvedValue({
      authenticated: true,
      currentBalance: 220,
      recentTransactions: [],
    });
    createAtmSessionMock.mockResolvedValue({
      authenticated: true,
      startingBalance: 220,
      withdrawals: [
        {
          amount: 40,
          status: "success",
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
          status: "success",
          dispensedNotes: { 5: 0, 10: 0, 20: 2 },
          balanceBefore: 220,
          balanceAfter: 180,
          overdraftWarning: false,
          remainingNotes: { 5: 4, 10: 15, 20: 5 },
        },
      ],
    });

    const hook = await authenticate();

    act(() => {
      hook.result.current.openAmountSelection();
      hook.result.current.selectQuickAmount(40);
    });

    await act(async () => {
      hook.result.current.confirmAmount();
    });

    expect(hook.result.current.screen).toBe("result");

    act(() => {
      hook.result.current.returnToMainMenu();
    });

    expect(hook.result.current.screen).toBe("home");
    expect(hook.result.current.summary).toBeNull();
    expect(hook.result.current.pendingAmount).toBeNull();
    expect(hook.result.current.plannedWithdrawals).toEqual([]);
  });
});
