import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { PinSlots } from "../components/PinSlots";

interface PinScreenProps {
  pin: string;
  pinError: string | null;
  isCheckingPin: boolean;
  hasQueuedWithdrawals: boolean;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PinScreen({
  pin,
  pinError,
  isCheckingPin,
  hasQueuedWithdrawals,
  onPinChange,
  onSubmit,
  onCancel,
}: PinScreenProps) {
  return (
    <AtmScreenLayout
      machineState={hasQueuedWithdrawals ? "RETRY AUTH" : "AUTH"}
      screenLabel="PIN entry"
      headline="Enter your 4-digit PIN"
      lead={
        hasQueuedWithdrawals
          ? "Your planned withdrawals are queued. Re-enter the PIN to re-authenticate before the ATM runs."
          : "Authenticate first. Incorrect PINs stop here and never reach the main ATM menu."
      }
      sessionLabel={hasQueuedWithdrawals ? "Ready to rerun session" : "Verify to continue"}
      footer={
        <div className="atm-actions">
          <button
            className="atm-action-button"
            disabled={isCheckingPin}
            onClick={onSubmit}
            type="button"
          >
            {isCheckingPin ? "Checking PIN" : "Continue"}
          </button>
          <button
            className="atm-action-button atm-action-button--secondary"
            disabled={isCheckingPin}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="atm-form-stack">
        <label className="atm-field" htmlFor="pin-input">
          <span>PIN code</span>
          <input
            autoComplete="one-time-code"
            id="pin-input"
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => onPinChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="1111"
            type="password"
            value={pin}
          />
        </label>
        <PinSlots pin={pin} />
        <p className="atm-helper">Demo PIN: 1111. Press Enter to verify immediately.</p>
        {pinError ? <p className="atm-helper atm-helper--error">{pinError}</p> : null}
      </div>
    </AtmScreenLayout>
  );
}
