import { AtmScreenLayout } from "../components/AtmScreenLayout";
import { ProcessingStatus } from "../components/ProcessingStatus";

interface ProcessingScreenProps {
  stage: string;
  requestedAmounts: string;
  isSubmitting: boolean;
}

export function ProcessingScreen({
  stage,
  requestedAmounts,
  isSubmitting,
}: ProcessingScreenProps) {
  return (
    <AtmScreenLayout
      machineState="PROCESSING"
      screenLabel="Session running"
      headline="Running your withdrawal"
      lead="The machine is processing your selected amount."
      sessionLabel="Please wait"
      showAuthenticatedSidebar
    >
      <ProcessingStatus
        stage={stage}
        message={`Requested amount: ${requestedAmounts}`}
        errorMessage={
          isSubmitting ? undefined : "The ATM returned to PIN entry before finishing this run."
        }
      />
    </AtmScreenLayout>
  );
}
