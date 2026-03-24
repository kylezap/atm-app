import type { AtmSessionSummary } from "../types/atm";

interface ApiErrorPayload {
  message?: string;
}

export async function createAtmSession(
  pin: string,
): Promise<AtmSessionSummary> {
  const response = await fetch("/api/atm/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    let message = "Unable to process ATM session.";

    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;

      if (errorPayload.message) {
        message = errorPayload.message;
      }
    } catch {
      // Ignore malformed error payloads and use the default message.
    }

    throw new Error(message);
  }

  return (await response.json()) as AtmSessionSummary;
}
