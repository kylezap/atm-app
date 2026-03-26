import type { AtmSessionSummary, PinVerificationResult } from "@atm/shared";

interface ApiErrorPayload {
  message?: string;
}

async function readApiError(response: Response, fallbackMessage: string) {
  let message = fallbackMessage;

  try {
    const errorPayload = (await response.json()) as ApiErrorPayload;

    if (errorPayload.message) {
      message = errorPayload.message;
    }
  } catch {
    // Ignore malformed error payloads and use the default message.
  }

  return message;
}

export async function verifyPin(pin: string): Promise<PinVerificationResult> {
  const response = await fetch("/api/atm/pin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Unable to verify PIN."));
  }

  return (await response.json()) as PinVerificationResult;
}

export async function createAtmSession(
  pin: string,
  withdrawals: number[],
): Promise<AtmSessionSummary> {
  const response = await fetch("/api/atm/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin, withdrawals }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Unable to process ATM session."));
  }

  return (await response.json()) as AtmSessionSummary;
}

export async function logoutAtmSession(): Promise<void> {
  const response = await fetch("/api/atm/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Unable to end ATM session."));
  }
}
