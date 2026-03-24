import type { WithdrawalResult } from "@atm/shared";
import { formatCurrency, formatFailureReason } from "../lib/atm-format";
import { NoteCountList } from "./NoteCountList";

interface SessionReceiptProps {
  result: WithdrawalResult;
}

export function SessionReceipt({ result }: SessionReceiptProps) {
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
          <p
            className={
              result.balanceAfter < 0
                ? "receipt-panel__balance receipt-panel__balance--negative"
                : "receipt-panel__balance"
            }
          >
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
