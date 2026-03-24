import {
  DEFAULT_WITHDRAWAL_SEQUENCE,
  INITIAL_NOTE_COUNTS,
  OVERDRAFT_LIMIT,
} from "@atm/shared";
import { useState } from "react";
import type { FormEvent } from "react";

import { Panel } from "../../components/Panel";
import { createAtmSession } from "../../lib/api";
import type { AtmSessionSummary, NoteCounts, WithdrawalResult } from "../../types/atm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function NoteCountList({ notes }: { notes: NoteCounts }) {
  return (
    <ul className="note-list">
      <li>£20: {notes[20]}</li>
      <li>£10: {notes[10]}</li>
      <li>£5: {notes[5]}</li>
    </ul>
  );
}

function WithdrawalCard({ result }: { result: WithdrawalResult }) {
  if (result.status === "failed") {
    return (
      <article className="result-card result-card--failed">
        <div className="result-card__row">
          <strong>{formatCurrency(result.amount)}</strong>
          <span>Failed</span>
        </div>
        <p>{result.reason}</p>
      </article>
    );
  }

  return (
    <article className="result-card">
      <div className="result-card__row">
        <strong>{formatCurrency(result.amount)}</strong>
        <span>Success</span>
      </div>
      <p>
        Balance: {formatCurrency(result.balanceBefore)} to{" "}
        {formatCurrency(result.balanceAfter)}
      </p>
      <div className="result-card__details">
        <div>
          <h3>Dispensed notes</h3>
          <NoteCountList notes={result.dispensedNotes} />
        </div>
        <div>
          <h3>Remaining notes</h3>
          <NoteCountList notes={result.remainingNotes} />
        </div>
      </div>
      {result.overdraftWarning ? (
        <p className="warning">Account is in overdraft after this withdrawal.</p>
      ) : null}
    </article>
  );
}

function SummaryPanel({ summary }: { summary: AtmSessionSummary }) {
  return (
    <Panel
      title="Session result"
      subtitle={`Ending balance: ${formatCurrency(summary.endingBalance)}`}
    >
      <div className="summary-grid">
        <div>
          <h3>Starting balance</h3>
          <p>{formatCurrency(summary.startingBalance)}</p>
        </div>
        <div>
          <h3>Ending balance</h3>
          <p>{formatCurrency(summary.endingBalance)}</p>
        </div>
        <div>
          <h3>Remaining notes</h3>
          <NoteCountList notes={summary.remainingNotes} />
        </div>
      </div>

      <div className="result-list">
        {summary.withdrawals.map((withdrawal, index) => (
          <WithdrawalCard
            key={`${withdrawal.amount}-${withdrawal.status}-${index}`}
            result={withdrawal}
          />
        ))}
      </div>
    </Panel>
  );
}

export function AtmPage() {
  const [pin, setPin] = useState("1111");
  const [withdrawalInputs, setWithdrawalInputs] = useState<string[]>(() =>
    DEFAULT_WITHDRAWAL_SEQUENCE.map((amount) => String(amount)),
  );
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AtmSessionSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateWithdrawal(index: number, value: string) {
    setWithdrawalInputs((current) =>
      current.map((withdrawal, currentIndex) =>
        currentIndex === index ? value : withdrawal,
      ),
    );
  }

  function addWithdrawal() {
    setWithdrawalInputs((current) => [...current, ""]);
  }

  function removeWithdrawal(index: number) {
    setWithdrawalInputs((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedWithdrawals = withdrawalInputs.map((value) => Number(value));

    if (
      parsedWithdrawals.length === 0 ||
      parsedWithdrawals.some(
        (amount) => !Number.isInteger(amount) || amount <= 0,
      )
    ) {
      setSummary(null);
      setErrorMessage("Enter at least one withdrawal amount greater than 0.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await createAtmSession(pin, parsedWithdrawals);
      setSummary(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to process ATM session.";

      setSummary(null);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">ATM APP</p>
        <h1>Lightweight cash withdrawal flow</h1>
        <p className="hero-copy">
          This frontend is wired to the local ATM API and uses the shared ATM
          contract package for note counts, withdrawal sequence, and result
          shapes.
        </p>
      </section>

      <div className="layout">
        <Panel
          title="Session input"
          subtitle="Authenticate once, then process the required withdrawal sequence."
        >
          <form className="session-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>PIN</span>
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => setPin(event.currentTarget.value)}
                placeholder="1111"
                value={pin}
              />
            </label>

            <div className="field">
              <span>Withdrawal amounts</span>
              <div className="withdrawal-inputs">
                {withdrawalInputs.map((amount, index) => (
                  <div className="withdrawal-input-row" key={`withdrawal-${index}`}>
                    <input
                      inputMode="numeric"
                      min="1"
                      onChange={(event) =>
                        updateWithdrawal(index, event.currentTarget.value)
                      }
                      placeholder="Amount"
                      step="1"
                      type="number"
                      value={amount}
                    />
                    <button
                      className="secondary-button"
                      disabled={loading || withdrawalInputs.length === 1}
                      onClick={() => removeWithdrawal(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="secondary-button secondary-button--ghost"
                disabled={loading}
                onClick={addWithdrawal}
                type="button"
              >
                Add withdrawal
              </button>
            </div>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Processing..." : "Start ATM session"}
            </button>
          </form>

          {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
        </Panel>

        <Panel
          title="ATM constraints"
          subtitle={`Overdraft limit: ${formatCurrency(OVERDRAFT_LIMIT)}`}
        >
          <div className="constraints-grid">
            <div>
              <h3>Supported notes</h3>
              <p>Amounts must be dispensable using fixed £20, £10, and £5 notes.</p>
            </div>

            <div>
              <h3>Starting note inventory</h3>
              <NoteCountList notes={INITIAL_NOTE_COUNTS} />
            </div>
          </div>
        </Panel>
      </div>

      {summary ? <SummaryPanel summary={summary} /> : null}
    </main>
  );
}
