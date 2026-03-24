import { useEffect, useReducer } from "react";

import { createAtmSession, verifyPin } from "../lib/api";
import type { AtmSessionSummary } from "@atm/shared";
import {
  PIN_SUCCESS_TIMEOUT_MS,
  PROCESSING_STAGES,
  TOTAL_WITHDRAWALS,
} from "../lib/atm-constants";
import {
  getCustomAmountHelper,
  isSupportedCustomAmount,
  sanitizeDigits,
} from "../lib/atm-amount";
import { mapTransactionHistory } from "../lib/atm-history";
import type { PendingSource, Screen, TransactionHistoryEntry } from "../types/atm-ui";

interface AtmFlowState {
  screen: Screen;
  pin: string;
  pinError: string | null;
  isCheckingPin: boolean;
  isPinVerified: boolean;
  currentBalance: number | null;
  plannedWithdrawals: number[];
  pendingAmount: number | null;
  pendingSource: PendingSource;
  customAmountValue: string;
  customAmountError: string | null;
  summary: AtmSessionSummary | null;
  resultIndex: number;
  isSubmitting: boolean;
  processingStageIndex: number;
  transactionHistory: TransactionHistoryEntry[];
  showOverdraftWarning: boolean;
}

type AtmFlowAction =
  | { type: "startSession" }
  | { type: "resetSession" }
  | { type: "pinChanged"; pin: string }
  | { type: "pinCheckStarted" }
  | {
      type: "pinCheckSucceeded";
      currentBalance: number;
      transactionHistory: TransactionHistoryEntry[];
    }
  | { type: "pinCheckFailed"; message: string }
  | { type: "openHome" }
  | { type: "openBalance" }
  | { type: "openTransactions" }
  | { type: "openAmountSelection" }
  | { type: "openCustomAmount" }
  | { type: "quickAmountSelected"; amount: number }
  | { type: "customAmountChanged"; value: string }
  | { type: "customAmountDeleted" }
  | { type: "customAmountValidationFailed"; message: string }
  | { type: "customAmountReviewed"; amount: number }
  | { type: "returnToCustomAmount" }
  | { type: "showOverdraftWarning" }
  | { type: "hideOverdraftWarning" }
  | { type: "confirmedAmountSubmitted"; withdrawals: number[]; nextScreen: Screen }
  | { type: "sessionStarted" }
  | {
      type: "sessionSucceeded";
      summary: AtmSessionSummary;
      transactionHistory: TransactionHistoryEntry[];
    }
  | { type: "sessionFailed"; message: string }
  | { type: "resultAdvanced" }
  | { type: "returnedToMainMenu" }
  | { type: "processingStageTicked" };

function createInitialState(): AtmFlowState {
  return {
    screen: "idle",
    pin: "",
    pinError: null,
    isCheckingPin: false,
    isPinVerified: false,
    currentBalance: null,
    plannedWithdrawals: [],
    pendingAmount: null,
    pendingSource: "quick",
    customAmountValue: "",
    customAmountError: null,
    summary: null,
    resultIndex: 0,
    isSubmitting: false,
    processingStageIndex: 0,
    transactionHistory: [],
    showOverdraftWarning: false,
  };
}

function atmFlowReducer(state: AtmFlowState, action: AtmFlowAction): AtmFlowState {
  switch (action.type) {
    case "startSession":
      return {
        ...state,
        screen: "pin",
      };
    case "resetSession":
      return createInitialState();
    case "pinChanged":
      return {
        ...state,
        pin: action.pin,
        isPinVerified: false,
        currentBalance: null,
        pinError: null,
      };
    case "pinCheckStarted":
      return {
        ...state,
        isCheckingPin: true,
        pinError: null,
      };
    case "pinCheckSucceeded":
      return {
        ...state,
        isCheckingPin: false,
        isPinVerified: true,
        currentBalance: action.currentBalance,
        transactionHistory: action.transactionHistory,
        screen: "pinSuccess",
      };
    case "pinCheckFailed":
      return {
        ...state,
        isCheckingPin: false,
        isPinVerified: false,
        pinError: action.message,
      };
    case "openHome":
      return {
        ...state,
        screen: "home",
      };
    case "openBalance":
      return {
        ...state,
        screen: "balance",
      };
    case "openTransactions":
      return {
        ...state,
        screen: "transactions",
      };
    case "openAmountSelection":
      return {
        ...state,
        showOverdraftWarning: false,
        screen: "amount",
      };
    case "openCustomAmount":
      return {
        ...state,
        pendingAmount: null,
        pendingSource: "custom",
        customAmountValue: "",
        customAmountError: null,
        showOverdraftWarning: false,
        screen: "customAmount",
      };
    case "quickAmountSelected":
      return {
        ...state,
        pendingAmount: action.amount,
        pendingSource: "quick",
        showOverdraftWarning: false,
        screen: "confirm",
      };
    case "customAmountChanged":
      return {
        ...state,
        customAmountValue: action.value,
        customAmountError: null,
      };
    case "customAmountDeleted":
      return {
        ...state,
        customAmountValue: state.customAmountValue.slice(0, -1),
        customAmountError: null,
      };
    case "customAmountValidationFailed":
      return {
        ...state,
        customAmountError: action.message,
      };
    case "customAmountReviewed":
      return {
        ...state,
        pendingAmount: action.amount,
        pendingSource: "custom",
        customAmountError: null,
        showOverdraftWarning: false,
        screen: "confirm",
      };
    case "returnToCustomAmount":
      return {
        ...state,
        showOverdraftWarning: false,
        screen: "customAmount",
      };
    case "showOverdraftWarning":
      return {
        ...state,
        showOverdraftWarning: true,
      };
    case "hideOverdraftWarning":
      return {
        ...state,
        showOverdraftWarning: false,
      };
    case "confirmedAmountSubmitted":
      return {
        ...state,
        plannedWithdrawals: action.withdrawals,
        pendingAmount: null,
        customAmountValue: "",
        customAmountError: null,
        showOverdraftWarning: false,
        screen: action.nextScreen,
      };
    case "sessionStarted":
      return {
        ...state,
        isSubmitting: true,
        summary: null,
        resultIndex: 0,
        processingStageIndex: 0,
        screen: "processing",
      };
    case "sessionSucceeded":
      return {
        ...state,
        isSubmitting: false,
        summary: action.summary,
        currentBalance: action.summary.endingBalance,
        transactionHistory: action.transactionHistory,
        screen: "result",
      };
    case "sessionFailed":
      return {
        ...state,
        isSubmitting: false,
        isPinVerified: false,
        pinError: action.message,
        screen: "pin",
      };
    case "resultAdvanced":
      if (
        state.summary &&
        state.summary.withdrawals[state.resultIndex]?.status === "success" &&
        state.resultIndex < state.summary.withdrawals.length - 1
      ) {
        return {
          ...state,
          resultIndex: state.resultIndex + 1,
        };
      }

      return {
        ...state,
        screen: "summary",
      };
    case "returnedToMainMenu":
      return {
        ...state,
        plannedWithdrawals: [],
        pendingAmount: null,
        pendingSource: "quick",
        customAmountValue: "",
        customAmountError: null,
        summary: null,
        resultIndex: 0,
        processingStageIndex: 0,
        showOverdraftWarning: false,
        screen: "home",
      };
    case "processingStageTicked":
      return {
        ...state,
        processingStageIndex:
          state.processingStageIndex === PROCESSING_STAGES.length - 1
            ? 0
            : state.processingStageIndex + 1,
      };
  }
}

export function useAtmFlow() {
  const [state, dispatch] = useReducer(atmFlowReducer, undefined, createInitialState);

  useEffect(() => {
    if (state.screen !== "processing") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: "processingStageTicked" });
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [state.screen]);

  useEffect(() => {
    if (state.screen !== "pinSuccess") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "openHome" });
    }, PIN_SUCCESS_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [state.screen]);

  const currentResult = state.summary?.withdrawals[state.resultIndex] ?? null;
  const customAmountHelper = getCustomAmountHelper(state.customAmountValue);
  const customAmountIsValid = isSupportedCustomAmount(Number(state.customAmountValue));

  async function submitPin() {
    if (state.pin.length !== 4) {
      dispatch({
        type: "pinCheckFailed",
        message: "Enter the 4-digit demo PIN to continue.",
      });
      return;
    }

    if (state.isPinVerified) {
      dispatch({ type: "openHome" });
      return;
    }

    dispatch({ type: "pinCheckStarted" });

    try {
      const authenticationResult = await verifyPin(state.pin);
      dispatch({
        type: "pinCheckSucceeded",
        currentBalance: authenticationResult.currentBalance,
        transactionHistory: mapTransactionHistory(authenticationResult.recentTransactions),
      });
    } catch (error) {
      dispatch({
        type: "pinCheckFailed",
        message: error instanceof Error ? error.message : "Unable to verify PIN.",
      });
    }
  }

  async function runSession(withdrawals: number[]) {
    dispatch({ type: "sessionStarted" });

    try {
      const summary = await createAtmSession(state.pin, withdrawals);
      dispatch({
        type: "sessionSucceeded",
        summary,
        transactionHistory: mapTransactionHistory(summary.recentTransactions),
      });
    } catch (error) {
      dispatch({
        type: "sessionFailed",
        message: error instanceof Error ? error.message : "Unable to process ATM session.",
      });
    }
  }

  function submitConfirmedAmount() {
    if (state.pendingAmount === null) {
      return;
    }

    const nextWithdrawals = [...state.plannedWithdrawals, state.pendingAmount];

    dispatch({
      type: "confirmedAmountSubmitted",
      withdrawals: nextWithdrawals,
      nextScreen:
        nextWithdrawals.length === TOTAL_WITHDRAWALS ? "processing" : "amount",
    });

    if (nextWithdrawals.length === TOTAL_WITHDRAWALS) {
      void runSession(nextWithdrawals);
      return;
    }
  }

  function startSession() {
    dispatch({ type: "startSession" });
  }

  function resetSession() {
    dispatch({ type: "resetSession" });
  }

  function updatePin(value: string) {
    dispatch({ type: "pinChanged", pin: sanitizeDigits(value) });
  }

  function openBalance() {
    dispatch({ type: "openBalance" });
  }

  function openTransactions() {
    dispatch({ type: "openTransactions" });
  }

  function openAmountSelection() {
    dispatch({ type: "openAmountSelection" });
  }

  function openCustomAmount() {
    dispatch({ type: "openCustomAmount" });
  }

  function selectQuickAmount(amount: number) {
    dispatch({ type: "quickAmountSelected", amount });
  }

  function updateCustomAmount(value: string) {
    dispatch({ type: "customAmountChanged", value: sanitizeDigits(value, 3) });
  }

  function deleteCustomDigit() {
    dispatch({ type: "customAmountDeleted" });
  }

  function reviewCustomAmount() {
    const parsedAmount = Number(state.customAmountValue);

    if (!isSupportedCustomAmount(parsedAmount)) {
      dispatch({
        type: "customAmountValidationFailed",
        message: getCustomAmountHelper(state.customAmountValue),
      });
      return;
    }

    dispatch({ type: "customAmountReviewed", amount: parsedAmount });
  }

  function hideOverdraftWarning() {
    dispatch({ type: "hideOverdraftWarning" });
  }

  function confirmAmount() {
    if (state.pendingAmount === null) {
      return;
    }

    if (
      state.currentBalance !== null &&
      state.currentBalance - state.pendingAmount < 0 &&
      !state.showOverdraftWarning
    ) {
      dispatch({ type: "showOverdraftWarning" });
      return;
    }

    submitConfirmedAmount();
  }

  function confirmOverdraft() {
    submitConfirmedAmount();
  }

  function goBackFromConfirm() {
    if (state.pendingSource === "custom") {
      dispatch({ type: "returnToCustomAmount" });
      return;
    }

    dispatch({ type: "openAmountSelection" });
  }

  function advanceResult() {
    dispatch({ type: "resultAdvanced" });
  }

  function returnToMainMenu() {
    dispatch({ type: "returnedToMainMenu" });
  }

  function goHome() {
    dispatch({ type: "openHome" });
  }

  return {
    ...state,
    currentResult,
    customAmountHelper,
    customAmountIsValid,
    startSession,
    resetSession,
    updatePin,
    submitPin,
    openBalance,
    openTransactions,
    openAmountSelection,
    openCustomAmount,
    selectQuickAmount,
    updateCustomAmount,
    deleteCustomDigit,
    reviewCustomAmount,
    confirmAmount,
    confirmOverdraft,
    hideOverdraftWarning,
    goBackFromConfirm,
    advanceResult,
    returnToMainMenu,
    goHome,
  };
}
