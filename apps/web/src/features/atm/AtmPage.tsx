import { INITIAL_NOTE_COUNTS } from "@atm/shared";
import { useEffect, useState } from "react";

import { AtmFrame } from "../../components/AtmFrame";
import { Keypad } from "../../components/Keypad";
import { QuickCashGrid } from "../../components/QuickCashGrid";
import { createAtmSession, verifyPin } from "../../lib/api";
import type { AtmSessionSummary, NoteCounts, WithdrawalResult } from "../../types/atm";

const QUICK_CASH_AMOUNTS = [20, 40, 60, 80, 100, 140] as const;
const PROCESSING_STAGES = [
  "Verifying PIN",
  "Checking balance",
  "Counting notes",
  "Preparing cash",
] as const;
const PIN_SUCCESS_TIMEOUT_MS = 2500;
const TOTAL_WITHDRAWALS = 1;

type Screen =
  | "idle"
  | "pin"
  | "pinSuccess"
  | "home"
  | "balance"
  | "transactions"
  | "amount"
  | "customAmount"
  | "confirm"
  | "processing"
  | "result"
  | "summary";

type PendingSource = "quick" | "custom";
type TransactionHistoryEntry = {
  id: string;
  label: string;
  detail: string;
  tone: "success" | "failed";
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function sanitizeDigits(value: string, maxLength = 4) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function formatFailureReason(reason: string) {
  switch (reason) {
    case "INVALID_PIN":
      return "Invalid PIN.";
    case "PIN_API_ERROR":
      return "The ATM could not reach the PIN service.";
    case "INVALID_PIN_RESPONSE":
      return "The PIN service returned an unreadable balance.";
    case "OVERDRAFT_LIMIT_EXCEEDED":
      return "This withdrawal exceeds the overdraft floor.";
    case "INSUFFICIENT_NOTES":
      return "The machine cannot make this amount exactly with the notes left.";
    default:
      return reason;
  }
}

function isSupportedCustomAmount(amount: number) {
  return Number.isInteger(amount) && amount > 0 && amount % 5 === 0;
}

function getNearestAmountSuggestions(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return [5, 10] as const;
  }

  const lower = Math.max(5, Math.floor(amount / 5) * 5);
  const upper = Math.max(5, Math.ceil(amount / 5) * 5);

  if (lower === upper) {
    return [lower, lower + 5] as const;
  }

  return [lower, upper] as const;
}

function getCustomAmountHelper(value: string) {
  if (!value) {
    return "Enter a custom amount in increments of £5.";
  }

  const parsedAmount = Number(value);

  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    return "Enter a whole-pound amount greater than zero.";
  }

  if (parsedAmount % 5 !== 0) {
    const [lower, upper] = getNearestAmountSuggestions(parsedAmount);
    return `This machine dispenses in £5 steps. Try ${formatCurrency(lower)} or ${formatCurrency(
      upper,
    )}.`;
  }

  return "The ATM will validate balance and note availability when the session runs.";
}

function NoteCountList({ notes }: { notes: NoteCounts }) {
  return (
    <ul className="atm-bullet-list">
      <li>£20 notes: {notes[20]}</li>
      <li>£10 notes: {notes[10]}</li>
      <li>£5 notes: {notes[5]}</li>
    </ul>
  );
}

function PinSlots({ pin }: { pin: string }) {
  return (
    <div aria-hidden="true" className="pin-slots">
      {Array.from({ length: 4 }, (_, index) => (
        <span className="pin-slot" key={`pin-slot-${index}`}>
          {index < pin.length ? "•" : ""}
        </span>
      ))}
    </div>
  );
}

function BalanceSidebarCard({ balance }: { balance: number }) {
  return (
    <section className="atm-aside-block atm-aside-block--balance" aria-live="polite">
      <p className="atm-aside-block__label">Current balance</p>
      <strong
        className={`atm-balance-value${balance < 0 ? " atm-balance-value--negative" : ""}`}
      >
        {formatCurrency(balance)}
      </strong>
    </section>
  );
}

function TransactionHistoryList({ entries }: { entries: TransactionHistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="atm-helper">No transactions yet.</p>;
  }

  return (
    <div>
      <p className="atm-aside-block__label">Previous transactions</p>
      <ul className="transaction-history">
        {entries.map((entry) => (
          <li
            className={`transaction-history__item transaction-history__item--${entry.tone}`}
            key={entry.id}
          >
            <strong>{entry.label}</strong>
            <span>{entry.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionReceipt({ result }: { result: WithdrawalResult }) {
  if (result.status === "failed") {
    return (
      <article className="receipt-panel receipt-panel--failed">
        <div className="receipt-panel__row">
          <strong>{formatCurrency(result.amount)}</strong>
          <span>Rejected</span>
        </div>
        <p>{formatFailureReason(result.reason)}</p>
      </article>
    );
  }

  return (
    <article className="receipt-panel">
      <div className="receipt-panel__row">
        <strong>{formatCurrency(result.amount)}</strong>
        <span>Dispensed</span>
      </div>
      <div className="receipt-panel__grid">
        <div>
          <p className="receipt-panel__label">Balance</p>
          <p className={result.balanceAfter < 0 ? "receipt-panel__balance receipt-panel__balance--negative" : "receipt-panel__balance"}>
            {formatCurrency(result.balanceBefore)} to {formatCurrency(result.balanceAfter)}
          </p>
        </div>
        <div>
          <p className="receipt-panel__label">Dispensed notes</p>
          <NoteCountList notes={result.dispensedNotes} />
        </div>
        <div>
          <p className="receipt-panel__label">Notes remaining</p>
          <NoteCountList notes={result.remainingNotes} />
        </div>
      </div>
      {result.overdraftWarning ? (
        <p className="atm-helper atm-helper--warning">
          Account remains in overdraft after this withdrawal.
        </p>
      ) : null}
    </article>
  );
}

function createTransactionHistoryEntry(result: WithdrawalResult) {
  const id = `${result.status}-${result.amount}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  if (result.status === "failed") {
    return {
      id,
      label: `${formatCurrency(result.amount)} rejected`,
      detail: formatFailureReason(result.reason),
      tone: "failed" as const,
    };
  }

  return {
    id,
    label: `${formatCurrency(result.amount)} dispensed`,
    detail: `Balance now ${formatCurrency(result.balanceAfter)}`,
    tone: "success" as const,
  };
}

function mapTransactionHistory(results: WithdrawalResult[]) {
  return results.map((result) => createTransactionHistoryEntry(result));
}

export function AtmPage() {
  const [screen, setScreen] = useState<Screen>("idle");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [plannedWithdrawals, setPlannedWithdrawals] = useState<number[]>([]);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [pendingSource, setPendingSource] = useState<PendingSource>("quick");
  const [customAmountValue, setCustomAmountValue] = useState("");
  const [customAmountError, setCustomAmountError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AtmSessionSummary | null>(null);
  const [resultIndex, setResultIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStageIndex, setProcessingStageIndex] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryEntry[]>([]);
  const [showOverdraftWarning, setShowOverdraftWarning] = useState(false);

  useEffect(() => {
    if (screen !== "processing") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setProcessingStageIndex((currentIndex) =>
        currentIndex === PROCESSING_STAGES.length - 1 ? 0 : currentIndex + 1,
      );
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [screen]);

  useEffect(() => {
    if (screen !== "pinSuccess") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setScreen("home");
    }, PIN_SUCCESS_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [screen]);

  const currentResult = summary?.withdrawals[resultIndex] ?? null;
  const customAmountHelper = getCustomAmountHelper(customAmountValue);
  const customAmountIsValid = isSupportedCustomAmount(Number(customAmountValue));
  const machineNotesExtra =
    isPinVerified || summary
      ? <TransactionHistoryList entries={transactionHistory} />
      : undefined;

  function resetSession() {
    setScreen("idle");
    setPin("");
    setPinError(null);
    setIsCheckingPin(false);
    setIsPinVerified(false);
    setCurrentBalance(null);
    setPlannedWithdrawals([]);
    setPendingAmount(null);
    setCustomAmountValue("");
    setCustomAmountError(null);
    setSummary(null);
    setResultIndex(0);
    setIsSubmitting(false);
    setProcessingStageIndex(0);
    setPendingSource("quick");
    setShowOverdraftWarning(false);
  }

  function handlePinChange(value: string) {
    setPin(sanitizeDigits(value));
    setIsPinVerified(false);
    setCurrentBalance(null);
    if (pinError) {
      setPinError(null);
    }
  }

  async function handlePinSubmit() {
    if (pin.length !== 4) {
      setPinError("Enter the 4-digit demo PIN to continue.");
      return;
    }

    if (isPinVerified) {
      setScreen("home");
      return;
    }

    setIsCheckingPin(true);
    setPinError(null);

    try {
      const authenticationResult = await verifyPin(pin);
      setIsPinVerified(true);
      setCurrentBalance(authenticationResult.currentBalance);
      setTransactionHistory(mapTransactionHistory(authenticationResult.recentTransactions));
      setScreen("pinSuccess");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to verify PIN.";
      setIsPinVerified(false);
      setPinError(message);
    } finally {
      setIsCheckingPin(false);
    }
  }

  function handleQuickAmountSelection(amount: number) {
    setPendingAmount(amount);
    setPendingSource("quick");
    setShowOverdraftWarning(false);
    setScreen("confirm");
  }

  function openCustomAmount() {
    setPendingAmount(null);
    setCustomAmountValue("");
    setCustomAmountError(null);
    setPendingSource("custom");
    setShowOverdraftWarning(false);
    setScreen("customAmount");
  }

  function handleCustomAmountChange(value: string) {
    setCustomAmountValue(sanitizeDigits(value, 3));
    if (customAmountError) {
      setCustomAmountError(null);
    }
  }

  function handleCustomAmountReview() {
    const parsedAmount = Number(customAmountValue);

    if (!isSupportedCustomAmount(parsedAmount)) {
      setCustomAmountError(getCustomAmountHelper(customAmountValue));
      return;
    }

    setPendingAmount(parsedAmount);
    setPendingSource("custom");
    setCustomAmountError(null);
    setShowOverdraftWarning(false);
    setScreen("confirm");
  }

  function handleDeleteCustomDigit() {
    setCustomAmountValue((currentValue) => currentValue.slice(0, -1));
    if (customAmountError) {
      setCustomAmountError(null);
    }
  }

  function submitConfirmedAmount() {
    if (pendingAmount === null) {
      return;
    }

    const nextWithdrawals = [...plannedWithdrawals, pendingAmount];
    setPlannedWithdrawals(nextWithdrawals);
    setPendingAmount(null);
    setCustomAmountValue("");
    setCustomAmountError(null);
    setShowOverdraftWarning(false);

    if (nextWithdrawals.length === TOTAL_WITHDRAWALS) {
      void runSession(nextWithdrawals);
      return;
    }

    setScreen("amount");
  }

  function handleConfirmAmount() {
    if (pendingAmount === null) {
      return;
    }

    if (currentBalance !== null && currentBalance - pendingAmount < 0 && !showOverdraftWarning) {
      setShowOverdraftWarning(true);
      return;
    }

    submitConfirmedAmount();
  }

  async function runSession(withdrawals: number[]) {
    setIsSubmitting(true);
    setSummary(null);
    setResultIndex(0);
    setProcessingStageIndex(0);
    setScreen("processing");

    try {
      const response = await createAtmSession(pin, withdrawals);
      setSummary(response);
      setCurrentBalance(response.endingBalance);
      setTransactionHistory(mapTransactionHistory(response.recentTransactions));

      setScreen("result");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to process ATM session.";
      setIsPinVerified(false);
      setPinError(message);
      setScreen("pin");
    } finally {
      setIsSubmitting(false);
    }
  }

  function advanceResult() {
    if (!summary || !currentResult) {
      return;
    }

    if (currentResult.status === "success" && resultIndex < summary.withdrawals.length - 1) {
      setResultIndex((currentValue) => currentValue + 1);
      return;
    }

    setScreen("summary");
  }

  function returnToMainMenu() {
    setPlannedWithdrawals([]);
    setPendingAmount(null);
    setPendingSource("quick");
    setCustomAmountValue("");
    setCustomAmountError(null);
    setSummary(null);
    setResultIndex(0);
    setProcessingStageIndex(0);
    setScreen("home");
  }

  if (screen === "idle") {
    return (
      <AtmFrame
        machineState="READY"
        screenLabel="Idle"
        headline="Cash machine ready"
        lead="Check your balance, get quick cash, withdraw a custom amount, and review previous transactions."
        sessionLabel="Awaiting customer"
        footer={
          <div className="atm-actions">
            <button className="atm-action-button" onClick={() => setScreen("pin")} type="button">
              Start session
            </button>
          </div>
        }
        aside={
          <section className="atm-aside-block">
            <p className="atm-aside-block__label">Starting inventory</p>
            <NoteCountList notes={INITIAL_NOTE_COUNTS} />
          </section>
        }
      >
        <div className="hero-screen">
          <p className="hero-screen__status">Hybrid retro / neo-brutalist monitor</p>
          <p>
            Choose quick cash or enter one custom amount by keypad, then complete the
            session with a single withdrawal.
          </p>
        </div>
      </AtmFrame>
    );
  }

  if (screen === "pin") {
    return (
      <AtmFrame
        machineState={plannedWithdrawals.length === TOTAL_WITHDRAWALS ? "RETRY AUTH" : "AUTH"}
        screenLabel="PIN entry"
        headline="Enter your 4-digit PIN"
        lead={
          plannedWithdrawals.length === TOTAL_WITHDRAWALS
            ? "Your planned withdrawals are queued. Re-enter the PIN to re-authenticate before the ATM runs."
            : "Authenticate first. Incorrect PINs stop here and never reach the main ATM menu."
        }
        sessionLabel={
          plannedWithdrawals.length === TOTAL_WITHDRAWALS
            ? "Ready to rerun session"
            : "Verify to continue"
        }
        footer={
          <div className="atm-actions">
            <button
              className="atm-action-button"
              disabled={isCheckingPin}
              onClick={() => void handlePinSubmit()}
              type="button"
            >
              {isCheckingPin ? "Checking PIN" : "Continue"}
            </button>
            <button
              className="atm-action-button atm-action-button--secondary"
              disabled={isCheckingPin}
              onClick={resetSession}
              type="button"
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="atm-form-stack">
          <label className="atm-field" htmlFor="pin-input">
            <span>PIN code</span>
            <input
              autoComplete="one-time-code"
              id="pin-input"
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => handlePinChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handlePinSubmit();
                }
              }}
              placeholder="1111"
              type="password"
              value={pin}
            />
          </label>
          <PinSlots pin={pin} />
          <p className="atm-helper">
            Demo PIN: 1111. Press Enter to verify immediately.
          </p>
          {pinError ? <p className="atm-helper atm-helper--error">{pinError}</p> : null}
        </div>
      </AtmFrame>
    );
  }

  if (screen === "home") {
    return (
      <AtmFrame
        machineState="MENU"
        screenLabel="Main menu"
        headline="Choose a service"
        lead="Start with quick cash, review your balance, inspect previous transactions, or enter a custom withdrawal amount."
        sessionLabel="Authenticated"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
        footer={
          <div className="atm-actions">
            <button
              className="atm-action-button atm-action-button--secondary"
              onClick={resetSession}
              type="button"
            >
              Sign out
            </button>
          </div>
        }
      >
        <div className="quick-cash-grid">
          <button className="atm-action-button" onClick={() => setScreen("amount")} type="button">
            Quick cash
          </button>
          <button
            className="atm-action-button atm-action-button--secondary"
            onClick={() => setScreen("balance")}
            type="button"
          >
            See current balance
          </button>
          <button
            className="atm-action-button atm-action-button--secondary"
            onClick={() => setScreen("transactions")}
            type="button"
          >
            Previous transactions
          </button>
          <button
            className="atm-action-button atm-action-button--secondary"
            onClick={openCustomAmount}
            type="button"
          >
            Custom amount
          </button>
        </div>
      </AtmFrame>
    );
  }

  if (screen === "pinSuccess") {
    return (
      <AtmFrame
        machineState="AUTH OK"
        screenLabel="PIN accepted"
        headline="PIN verified"
        lead="Authentication succeeded. Loading your account before opening the main menu."
        sessionLabel="Please wait"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
      >
        <div className="processing-screen" aria-live="polite">
          <div className="processing-screen__pulse" />
          <p className="processing-screen__stage">Welcome back</p>
          <p>Main menu will appear in a moment.</p>
        </div>
      </AtmFrame>
    );
  }

  if (screen === "transactions") {
    return (
      <AtmFrame
        machineState="HISTORY"
        screenLabel="Transactions"
        headline="Previous transactions"
        lead="Review the latest withdrawals recorded for this session before returning to the main menu."
        sessionLabel="Authenticated"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        footer={
          <div className="atm-actions">
            <button
              className="atm-action-button atm-action-button--secondary"
              onClick={() => setScreen("home")}
              type="button"
            >
              Back to main menu
            </button>
          </div>
        }
      >
        <div className="summary-screen">
          <div className="summary-screen__receipts">
            <TransactionHistoryList entries={transactionHistory} />
          </div>
        </div>
      </AtmFrame>
    );
  }

  if (screen === "balance") {
    return (
      <AtmFrame
        machineState="BALANCE"
        screenLabel="Balance"
        headline="Current balance"
        lead="Review your available balance, then return to the main menu for another action."
        sessionLabel="Authenticated"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
        footer={
          <div className="atm-actions">
            <button
              className="atm-action-button atm-action-button--secondary"
              onClick={() => setScreen("home")}
              type="button"
            >
              Back to main menu
            </button>
          </div>
        }
      >
        <div className="summary-screen">
          <div className="summary-screen__totals">
            <article className="summary-stat">
              <p className="summary-stat__label">Available balance</p>
              <strong
                className={
                  currentBalance !== null && currentBalance < 0
                    ? "atm-balance-value atm-balance-value--negative"
                    : "atm-balance-value"
                }
              >
                {formatCurrency(currentBalance ?? 0)}
              </strong>
              <p
                className={`atm-helper${
                  currentBalance !== null && currentBalance < 0 ? " atm-helper--error" : ""
                }`}
              >
                {currentBalance !== null && currentBalance < 0
                  ? "Your account is currently in overdraft."
                  : "Select another option from the menu when you are ready."}
              </p>
            </article>
          </div>
        </div>
      </AtmFrame>
    );
  }

  if (screen === "amount") {
    return (
      <AtmFrame
        machineState="SELECT"
        screenLabel="Quick cash"
        headline="Choose your withdrawal amount"
        lead="Use one of the machine presets or open the keypad for a custom amount."
        sessionLabel="Single withdrawal session"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
        footer={
          <div className="atm-actions">
            <button
              className="atm-action-button atm-action-button--secondary"
              onClick={() => setScreen("home")}
              type="button"
            >
              Back to main menu
            </button>
          </div>
        }
      >
        <QuickCashGrid
          amounts={[...QUICK_CASH_AMOUNTS]}
          formatAmount={formatCurrency}
          onCancel={resetSession}
          onOtherAmount={openCustomAmount}
          onSelectAmount={handleQuickAmountSelection}
        />
      </AtmFrame>
    );
  }

  if (screen === "customAmount") {
    return (
      <AtmFrame
        machineState="KEYPAD"
        screenLabel="Other amount"
        headline="Enter your withdrawal amount"
        lead="The ATM only dispenses exact amounts in £5 steps."
        sessionLabel="Single withdrawal session"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
        footer={
          <div className="atm-actions">
            <button
              className="atm-action-button atm-action-button--secondary"
              onClick={() => setScreen("home")}
              type="button"
            >
              Back to main menu
            </button>
          </div>
        }
      >
        <Keypad
          errorMessage={customAmountError}
          helperText={customAmountHelper}
          onClear={() => handleCustomAmountChange("")}
          onDelete={handleDeleteCustomDigit}
          onSubmit={handleCustomAmountReview}
          onValueChange={handleCustomAmountChange}
          submitDisabled={!customAmountIsValid}
          value={customAmountValue}
        />
      </AtmFrame>
    );
  }

  if (screen === "confirm" && pendingAmount !== null) {
    return (
      <AtmFrame
        machineState="CONFIRM"
        screenLabel="Confirm amount"
        headline={`Confirm ${formatCurrency(pendingAmount)} withdrawal`}
        lead="The ATM will validate balance and notes, then attempt this withdrawal."
        sessionLabel="Single withdrawal session"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
        footer={
          <div className="atm-actions">
            <button className="atm-action-button" onClick={handleConfirmAmount} type="button">
              {showOverdraftWarning ? "Confirm overdraft" : "Confirm amount"}
            </button>
            <button
              className="atm-action-button atm-action-button--secondary"
              onClick={() => {
                setShowOverdraftWarning(false);
                setScreen(pendingSource === "custom" ? "customAmount" : "amount");
              }}
              type="button"
            >
              Back
            </button>
          </div>
        }
      >
        <div className="confirm-card">
          <p className="confirm-card__amount">{formatCurrency(pendingAmount)}</p>
          <p>
            Balance and note checks happen when the ATM runs this withdrawal.
          </p>
        </div>
        {showOverdraftWarning ? (
          <div
            aria-labelledby="overdraft-warning-title"
            aria-modal="true"
            className="atm-modal"
            role="dialog"
          >
            <div className="atm-modal__backdrop" onClick={() => setShowOverdraftWarning(false)} />
            <div className="atm-modal__panel">
              <p className="atm-modal__eyebrow">Overdraft warning</p>
              <h3 id="overdraft-warning-title">This withdrawal will put the account into overdraft</h3>
              <p>
                Proceed with {formatCurrency(pendingAmount)} and continue with a balance of{" "}
                {formatCurrency((currentBalance ?? 0) - pendingAmount)}?
              </p>
              <div className="atm-actions">
                <button className="atm-action-button" onClick={submitConfirmedAmount} type="button">
                  Yes, continue
                </button>
                <button
                  className="atm-action-button atm-action-button--secondary"
                  onClick={() => setShowOverdraftWarning(false)}
                  type="button"
                >
                  No, go back
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AtmFrame>
    );
  }

  if (screen === "processing") {
    return (
      <AtmFrame
        machineState="PROCESSING"
        screenLabel="Session running"
        headline="Running your withdrawal"
        lead="The machine is processing your selected amount."
        sessionLabel="Please wait"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
      >
        <div className="processing-screen" aria-live="polite">
          <div className="processing-screen__pulse" />
          <p className="processing-screen__stage">{PROCESSING_STAGES[processingStageIndex]}</p>
          <p>Requested amount: {plannedWithdrawals.map(formatCurrency).join(" / ")}</p>
          {isSubmitting ? null : (
            <p className="atm-helper atm-helper--error">
              The ATM returned to PIN entry before finishing this run.
            </p>
          )}
        </div>
      </AtmFrame>
    );
  }

  if (screen === "result" && summary && currentResult) {
    return (
      <AtmFrame
        machineState={currentResult.status === "success" ? "DISPENSED" : "STOPPED"}
        screenLabel="Withdrawal result"
        headline={
          currentResult.status === "success" ? "Cash dispensed" : "Withdrawal could not be completed"
        }
        lead={
          currentResult.status === "success"
            ? "Review the note mix and updated balance for this session."
            : "The ATM could not complete the withdrawal and left your balance unchanged."
        }
        sessionLabel="Single withdrawal result"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
        footer={
          <div className="atm-actions">
            {currentResult.status === "success" ? (
              <button
                className="atm-action-button atm-action-button--secondary"
                onClick={returnToMainMenu}
                type="button"
              >
                Main menu
              </button>
            ) : null}
            <button className="atm-action-button" onClick={advanceResult} type="button">
              Finish session
            </button>
          </div>
        }
      >
        <SessionReceipt result={currentResult} />
      </AtmFrame>
    );
  }

  if (screen === "summary" && summary) {
    return (
      <AtmFrame
        machineState="COMPLETE"
        screenLabel="Session summary"
        headline="ATM session complete"
        lead="The monitor now closes with a receipt-style summary instead of scattered result cards."
        sessionLabel="Session finished"
        sidebarPrimary={
          currentBalance !== null ? <BalanceSidebarCard balance={currentBalance} /> : null
        }
        machineNotesExtra={machineNotesExtra}
        footer={
          <div className="atm-actions">
            <button className="atm-action-button" onClick={resetSession} type="button">
              Start a new session
            </button>
          </div>
        }
      >
        <div className="summary-screen">
          <div className="summary-screen__totals">
            <article className="summary-stat">
              <p className="summary-stat__label">Remaining notes</p>
              <NoteCountList notes={summary.remainingNotes} />
            </article>
          </div>

          <div className="summary-screen__receipts">
            {summary.withdrawals.map((withdrawal, index) => (
              <SessionReceipt
                key={`${withdrawal.amount}-${withdrawal.status}-${index}`}
                result={withdrawal}
              />
            ))}
          </div>
        </div>
      </AtmFrame>
    );
  }

  return null;
}
