import type { AtmSessionSummary, PinRequest } from "@atm/shared";

export interface ProcessSessionInput extends PinRequest {}

export interface AtmOrchestrator {
  processSession(input: ProcessSessionInput): Promise<AtmSessionSummary>;
}
