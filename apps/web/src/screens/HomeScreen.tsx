import { AtmScreenLayout } from "../components/AtmScreenLayout";

interface HomeScreenProps {
  onOpenAmountSelection: () => void;
  onOpenBalance: () => void;
  onOpenTransactions: () => void;
  onOpenCustomAmount: () => void;
  onSignOut: () => void;
}

export function HomeScreen({
  onOpenAmountSelection,
  onOpenBalance,
  onOpenTransactions,
  onOpenCustomAmount,
  onSignOut,
}: HomeScreenProps) {
  return (
    <AtmScreenLayout
      machineState="MENU"
      screenLabel="Main menu"
      headline="Choose a service"
      lead="Start with quick cash, review your balance, inspect previous transactions, or enter a custom withdrawal amount."
      sessionLabel="Authenticated"
      showAuthenticatedSidebar
      footer={
        <div className="atm-actions">
          <button
            className="atm-action-button atm-action-button--secondary"
            onClick={onSignOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      }
    >
      <div className="quick-cash-grid">
        <button className="atm-action-button" onClick={onOpenAmountSelection} type="button">
          Quick cash
        </button>
        <button
          className="atm-action-button atm-action-button--secondary"
          onClick={onOpenBalance}
          type="button"
        >
          See current balance
        </button>
        <button
          className="atm-action-button atm-action-button--secondary"
          onClick={onOpenTransactions}
          type="button"
        >
          Previous transactions
        </button>
        <button
          className="atm-action-button atm-action-button--secondary"
          onClick={onOpenCustomAmount}
          type="button"
        >
          Custom amount
        </button>
      </div>
    </AtmScreenLayout>
  );
}
