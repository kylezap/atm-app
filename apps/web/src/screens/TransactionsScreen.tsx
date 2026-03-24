import type { TransactionHistoryEntry } from "../types/atm-ui";
import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { TransactionHistoryList } from "../components/TransactionHistoryList";

interface TransactionsScreenProps {
  entries: TransactionHistoryEntry[];
  onBack: () => void;
}

export function TransactionsScreen({ entries, onBack }: TransactionsScreenProps) {
  return (
    <AtmScreenLayout
      machineState="HISTORY"
      screenLabel="Transactions"
      headline="Previous transactions"
      lead="Review the latest withdrawals recorded for this session before returning to the main menu."
      sessionLabel="Authenticated"
      showAuthenticatedSidebar
      footer={
        <div className="atm-actions">
          <button className="atm-action-button atm-action-button--secondary" onClick={onBack} type="button">
            Back to main menu
          </button>
        </div>
      }
    >
      <div className="summary-screen">
        <div className="summary-screen__receipts">
          <TransactionHistoryList entries={entries} />
        </div>
      </div>
    </AtmScreenLayout>
  );
}
