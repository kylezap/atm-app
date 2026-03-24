import { QuickCashGrid } from "../components/QuickCashGrid";
import { AtmScreenLayout } from "../components/AtmScreenLayout";

interface QuickCashScreenProps {
  amounts: number[];
  formatAmount: (amount: number) => string;
  onBack: () => void;
  onOtherAmount: () => void;
  onSelectAmount: (amount: number) => void;
  onSignOut: () => void;
}

export function QuickCashScreen({
  amounts,
  formatAmount,
  onBack,
  onOtherAmount,
  onSelectAmount,
  onSignOut,
}: QuickCashScreenProps) {
  return (
    <AtmScreenLayout
      machineState="SELECT"
      screenLabel="Quick cash"
      headline="Choose your withdrawal amount"
      lead="Use one of the machine presets or open the keypad for a custom amount."
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
      <QuickCashGrid
        amounts={amounts}
        formatAmount={formatAmount}
        onCancel={onSignOut}
        onOtherAmount={onOtherAmount}
        onSelectAmount={onSelectAmount}
      />
    </AtmScreenLayout>
  );
}
