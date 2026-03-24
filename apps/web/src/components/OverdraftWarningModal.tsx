import { formatCurrency } from "../lib/atm-format";

interface OverdraftWarningModalProps {
  currentBalance: number | null;
  pendingAmount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function OverdraftWarningModal({
  currentBalance,
  pendingAmount,
  onCancel,
  onConfirm,
}: OverdraftWarningModalProps) {
  return (
    <div
      aria-labelledby="overdraft-warning-title"
      aria-modal="true"
      className="atm-modal"
      role="dialog"
    >
      <div className="atm-modal__backdrop" onClick={onCancel} />
      <div className="atm-modal__panel">
        <p className="atm-modal__eyebrow">Overdraft warning</p>
        <h3 id="overdraft-warning-title">This withdrawal will put the account into overdraft</h3>
        <p>
          Proceed with {formatCurrency(pendingAmount)} and continue with a balance of{" "}
          {formatCurrency((currentBalance ?? 0) - pendingAmount)}?
        </p>
        <div className="atm-actions">
          <button className="atm-action-button" onClick={onConfirm} type="button">
            Yes, continue
          </button>
          <button className="atm-action-button atm-action-button--secondary" onClick={onCancel} type="button">
            No, go back
          </button>
        </div>
      </div>
    </div>
  );
}
