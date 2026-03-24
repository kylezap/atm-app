import { Keypad } from "../components/Keypad";
import { AtmScreenLayout } from "../components/AtmScreenLayout";

interface CustomAmountScreenProps {
  value: string;
  helperText: string;
  errorMessage: string | null;
  submitDisabled: boolean;
  onBack: () => void;
  onClear: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
}

export function CustomAmountScreen({
  value,
  helperText,
  errorMessage,
  submitDisabled,
  onBack,
  onClear,
  onDelete,
  onSubmit,
  onValueChange,
}: CustomAmountScreenProps) {
  return (
    <AtmScreenLayout
      machineState="KEYPAD"
      screenLabel="Other amount"
      headline="Enter your withdrawal amount"
      lead="The ATM only dispenses exact amounts in £5 steps."
      sessionLabel="Single withdrawal session"
      showAuthenticatedSidebar
      footer={
        <div className="atm-actions">
          <button className="atm-action-button atm-action-button--secondary" onClick={onBack} type="button">
            Back to main menu
          </button>
        </div>
      }
    >
      <Keypad
        errorMessage={errorMessage}
        helperText={helperText}
        onClear={onClear}
        onDelete={onDelete}
        onSubmit={onSubmit}
        onValueChange={onValueChange}
        submitDisabled={submitDisabled}
        value={value}
      />
    </AtmScreenLayout>
  );
}
