import type { AtmSessionSummary } from "@atm/shared";
import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { NoteCountList } from "../components/NoteCountList";
import { SessionReceipt } from "../components/SessionReceipt";

interface SummaryScreenProps {
  summary: AtmSessionSummary;
  onStartNewSession: () => void;
}

export function SummaryScreen({ summary, onStartNewSession }: SummaryScreenProps) {
  return (
    <AtmScreenLayout
      machineState="COMPLETE"
      screenLabel="Session summary"
      headline="ATM session complete"
      lead="The monitor now closes with a receipt-style summary instead of scattered result cards."
      sessionLabel="Session finished"
      showAuthenticatedSidebar
      footer={
        <div className="atm-actions">
          <button className="atm-action-button" onClick={onStartNewSession} type="button">
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
    </AtmScreenLayout>
  );
}
