import type { TransactionHistoryEntry } from "../types/atm-ui";

interface TransactionHistoryListProps {
  entries: TransactionHistoryEntry[];
}

export function TransactionHistoryList({ entries }: TransactionHistoryListProps) {
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
