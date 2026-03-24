import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { ProcessingStatus } from "../components/ProcessingStatus";

export function PinSuccessScreen() {
  return (
    <AtmScreenLayout
      machineState="AUTH OK"
      screenLabel="PIN accepted"
      headline="PIN verified"
      lead="Authentication succeeded. Loading your account before opening the main menu."
      sessionLabel="Please wait"
      showAuthenticatedSidebar
    >
      <ProcessingStatus stage="Welcome back" message="Main menu will appear in a moment." />
    </AtmScreenLayout>
  );
}
