interface QuickCashGridProps {
  amounts: number[];
  disabled?: boolean;
  formatAmount: (amount: number) => string;
  onCancel: () => void;
  onOtherAmount: () => void;
  onSelectAmount: (amount: number) => void;
}

export function QuickCashGrid({
  amounts,
  disabled = false,
  formatAmount,
  onCancel,
  onOtherAmount,
  onSelectAmount,
}: QuickCashGridProps) {
  return (
    <div className="quick-cash-grid">
      {amounts.map((amount) => (
        <button
          className="atm-action-button"
          disabled={disabled}
          key={amount}
          onClick={() => onSelectAmount(amount)}
          type="button"
        >
          {formatAmount(amount)}
        </button>
      ))}

      <button
        className="atm-action-button atm-action-button--secondary"
        disabled={disabled}
        onClick={onOtherAmount}
        type="button"
      >
        Other amount
      </button>

      <button
        className="atm-action-button atm-action-button--secondary"
        disabled={disabled}
        onClick={onCancel}
        type="button"
      >
        Sign out
      </button>
    </div>
  );
}
