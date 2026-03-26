import { QUICK_CASH_AMOUNTS, PROCESSING_STAGES } from "../lib/atm-constants";
import { formatCurrency } from "../lib/atm-format";
import { useAtmFlow } from "../hooks/useAtmFlow";
import { BalanceScreen } from "../screens/BalanceScreen";
import { ConfirmScreen } from "../screens/ConfirmScreen";
import { CustomAmountScreen } from "../screens/CustomAmountScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { IdleScreen } from "../screens/IdleScreen";
import { PinScreen } from "../screens/PinScreen";
import { PinSuccessScreen } from "../screens/PinSuccessScreen";
import { ProcessingScreen } from "../screens/ProcessingScreen";
import { QuickCashScreen } from "../screens/QuickCashScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";

export function AtmPage() {
  const flow = useAtmFlow();

  switch (flow.screen) {
    case "idle":
      return <IdleScreen onStartSession={flow.startSession} />;
    case "pin":
      return (
        <PinScreen
          pin={flow.pin}
          pinError={flow.pinError}
          isCheckingPin={flow.isCheckingPin}
          hasQueuedWithdrawals={flow.plannedWithdrawals.length > 0}
          onPinChange={flow.updatePin}
          onSubmit={() => void flow.submitPin()}
          onCancel={() => void flow.resetSession()}
        />
      );
    case "home":
      return (
        <HomeScreen
          onOpenAmountSelection={flow.openAmountSelection}
          onOpenBalance={flow.openBalance}
          onOpenTransactions={flow.openTransactions}
          onOpenCustomAmount={flow.openCustomAmount}
          onSignOut={() => void flow.resetSession()}
        />
      );
    case "pinSuccess":
      return <PinSuccessScreen />;
    case "transactions":
      return <TransactionsScreen entries={flow.transactionHistory} onBack={flow.goHome} />;
    case "balance":
      return <BalanceScreen currentBalance={flow.currentBalance} onBack={flow.goHome} />;
    case "amount":
      return (
        <QuickCashScreen
          amounts={[...QUICK_CASH_AMOUNTS]}
          formatAmount={formatCurrency}
          onBack={flow.goHome}
          onOtherAmount={flow.openCustomAmount}
          onSelectAmount={flow.selectQuickAmount}
          onSignOut={() => void flow.resetSession()}
        />
      );
    case "customAmount":
      return (
        <CustomAmountScreen
          value={flow.customAmountValue}
          helperText={flow.customAmountHelper}
          errorMessage={flow.customAmountError}
          submitDisabled={!flow.customAmountIsValid}
          onBack={flow.goHome}
          onClear={() => flow.updateCustomAmount("")}
          onDelete={flow.deleteCustomDigit}
          onSubmit={flow.reviewCustomAmount}
          onValueChange={flow.updateCustomAmount}
        />
      );
    case "confirm":
      if (flow.pendingAmount === null) {
        throw new Error("Confirm screen requires a pending amount.");
      }

      return (
        <ConfirmScreen
          pendingAmount={flow.pendingAmount}
          currentBalance={flow.currentBalance}
          showOverdraftWarning={flow.showOverdraftWarning}
          onBack={flow.goBackFromConfirm}
          onConfirm={flow.confirmAmount}
          onConfirmOverdraft={flow.confirmOverdraft}
          onHideOverdraftWarning={flow.hideOverdraftWarning}
        />
      );
    case "processing":
      return (
        <ProcessingScreen
          stage={PROCESSING_STAGES[flow.processingStageIndex]}
          requestedAmounts={flow.plannedWithdrawals.map(formatCurrency).join(" / ")}
          isSubmitting={flow.isSubmitting}
        />
      );
    case "result":
      if (!flow.summary || !flow.currentResult) {
        throw new Error("Result screen requires a completed session result.");
      }

      return (
        <ResultScreen
          result={flow.currentResult}
          onFinish={() => void flow.resetSession()}
          onMainMenu={flow.returnToMainMenu}
        />
      );
  }
}
