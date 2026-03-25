import { INITIAL_NOTE_COUNTS } from "@atm/shared";

import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { NoteCountList } from "../components/NoteCountList";

interface IdleScreenProps {
  onStartSession: () => void;
}

export function IdleScreen({ onStartSession }: IdleScreenProps) {
  return (
    <AtmScreenLayout
      machineState="READY"
      screenLabel="Idle"
      headline="Cash machine ready"
      lead="Check your balance, get quick cash, withdraw a custom amount, and review previous transactions."
      sessionLabel="Awaiting customer"
      footer={
        <div className="atm-actions">
          <button
            className="atm-action-button"
            onClick={onStartSession}
            type="button"
          >
            Log in
          </button>
        </div>
      }
    >
      <div className="hero-screen">
        <p className="hero-screen__status">
          Hybrid retro / neo-brutalist monitor
        </p>
        <p>
          Choose quick cash or enter one custom amount by keypad, then complete
          the session with a single withdrawal.
        </p>
      </div>
    </AtmScreenLayout>
  );
}
