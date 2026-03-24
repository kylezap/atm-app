import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { formatCurrency } from "../lib/atm-format";

interface BalanceScreenProps {
  currentBalance: number | null;
  onBack: () => void;
}

export function BalanceScreen({ currentBalance, onBack }: BalanceScreenProps) {
  return (
    <AtmScreenLayout
      machineState="BALANCE"
      screenLabel="Balance"
      headline="Current balance"
      lead="Review your available balance, then return to the main menu for another action."
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
    </AtmScreenLayout>
  );
}
