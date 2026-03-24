interface ProcessingStatusProps {
  stage: string;
  message: string;
  errorMessage?: string;
}

export function ProcessingStatus({ stage, message, errorMessage }: ProcessingStatusProps) {
  return (
    <div className="processing-screen" aria-live="polite">
      <div className="processing-screen__pulse" />
      <p className="processing-screen__stage">{stage}</p>
      <p>{message}</p>
      {errorMessage ? <p className="atm-helper atm-helper--error">{errorMessage}</p> : null}
    </div>
  );
}
