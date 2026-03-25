import type { WithdrawalResult } from "@atm/shared";
import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { SessionReceipt } from "../components/SessionReceipt";

interface ResultScreenProps {
  result: WithdrawalResult;
  onFinish: () => void;
  onMainMenu: () => void;
}

export function ResultScreen({ result, onFinish, onMainMenu }: ResultScreenProps) {
  return (
    <AtmScreenLayout
      machineState={result.status === "success" ? "DISPENSED" : "STOPPED"}
      screenLabel="Withdrawal result"
      headline={
        result.status === "success" ? "Cash dispensed" : "Withdrawal could not be completed"
      }
      lead={
        result.status === "success"
          ? "Review the note mix and updated balance for this session."
          : "The ATM could not complete the withdrawal and left your balance unchanged."
      }
      sessionLabel="Single withdrawal result"
      showAuthenticatedSidebar
      footer={
        <div className="atm-actions">
          <button
            className="atm-action-button atm-action-button--secondary"
            onClick={onMainMenu}
            type="button"
          >
            Main menu
          </button>
          <button className="atm-action-button" onClick={onFinish} type="button">
            Sign out
          </button>
        </div>
      }
    >
      <SessionReceipt result={result} />
    </AtmScreenLayout>
  );
}
