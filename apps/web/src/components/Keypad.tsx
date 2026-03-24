const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "DEL"] as const;

interface KeypadProps {
  disabled?: boolean;
  errorMessage?: string | null;
  helperText: string;
  onClear: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  submitDisabled?: boolean;
  value: string;
}

export function Keypad({
  disabled = false,
  errorMessage,
  helperText,
  onClear,
  onDelete,
  onSubmit,
  onValueChange,
  submitDisabled = false,
  value,
}: KeypadProps) {
  return (
    <div className="keypad-panel">
      <label className="atm-field" htmlFor="custom-amount">
        <span>Custom amount</span>
        <input
          aria-describedby="custom-amount-helper"
          autoComplete="off"
          disabled={disabled}
          id="custom-amount"
          inputMode="numeric"
          onChange={(event) => onValueChange(event.currentTarget.value)}
          placeholder="0"
          value={value}
        />
      </label>

      <p
        className={errorMessage ? "atm-helper atm-helper--error" : "atm-helper"}
        id="custom-amount-helper"
      >
        {errorMessage ?? helperText}
      </p>

      <div className="keypad-grid" role="group" aria-label="Numeric keypad">
        {KEYS.map((keyValue) => {
          const label =
            keyValue === "CLR"
              ? "Clear amount"
              : keyValue === "DEL"
                ? "Delete last digit"
                : `Enter ${keyValue}`;

          const onClick =
            keyValue === "CLR"
              ? onClear
              : keyValue === "DEL"
                ? onDelete
                : () => onValueChange(`${value}${keyValue}`);

          return (
            <button
              aria-label={label}
              className={
                keyValue === "CLR" || keyValue === "DEL"
                  ? "keypad-button keypad-button--utility"
                  : "keypad-button"
              }
              disabled={disabled}
              key={keyValue}
              onClick={onClick}
              type="button"
            >
              {keyValue}
            </button>
          );
        })}
      </div>

      <button
        className="atm-action-button"
        disabled={disabled || submitDisabled}
        onClick={onSubmit}
        type="button"
      >
        Review amount
      </button>
    </div>
  );
}
