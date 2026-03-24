import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { OverdraftWarningModal } from "../components/OverdraftWarningModal";
import { formatCurrency } from "../lib/atm-format";

interface ConfirmScreenProps {
  pendingAmount: number;
  currentBalance: number | null;
  showOverdraftWarning: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onConfirmOverdraft: () => void;
  onHideOverdraftWarning: () => void;
}

export function ConfirmScreen({
  pendingAmount,
  currentBalance,
  showOverdraftWarning,
  onBack,
  onConfirm,
  onConfirmOverdraft,
  onHideOverdraftWarning,
}: ConfirmScreenProps) {
  return (
    <AtmScreenLayout
      machineState="CONFIRM"
      screenLabel="Confirm amount"
      headline={`Confirm ${formatCurrency(pendingAmount)} withdrawal`}
      lead="The ATM will validate balance and notes, then attempt this withdrawal."
      sessionLabel="Single withdrawal session"
      showAuthenticatedSidebar
      footer={
        <div className="atm-actions">
          <button className="atm-action-button" onClick={onConfirm} type="button">
            {showOverdraftWarning ? "Confirm overdraft" : "Confirm amount"}
          </button>
          <button className="atm-action-button atm-action-button--secondary" onClick={onBack} type="button">
            Back
          </button>
        </div>
      }
    >
      <div className="confirm-card">
        <p className="confirm-card__amount">{formatCurrency(pendingAmount)}</p>
        <p>Balance and note checks happen when the ATM runs this withdrawal.</p>
      </div>
      {showOverdraftWarning ? (
        <OverdraftWarningModal
          currentBalance={currentBalance}
          pendingAmount={pendingAmount}
          onCancel={onHideOverdraftWarning}
          onConfirm={onConfirmOverdraft}
        />
      ) : null}
    </AtmScreenLayout>
  );
}
