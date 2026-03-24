import type { PinApiSuccessResponse } from "@atm/shared";
import { PIN_API_URL, pinApiSuccessResponseSchema } from "@atm/shared";

import {
  InvalidPinError,
  InvalidPinResponseError,
  PinApiError,
} from "../lib/http-error";

export interface PinApiClient {
  verifyPin(pin: string): Promise<PinApiSuccessResponse>;
}

type FetchLike = typeof fetch;

interface CreatePinApiClientOptions {
  fetchImpl?: FetchLike;
}

export function createPinApiClient(
  options: CreatePinApiClientOptions = {},
): PinApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async verifyPin(pin: string) {
      let response: Response;

      try {
        response = await fetchImpl(PIN_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pin }),
        });
      } catch {
        throw new PinApiError();
      }

      if (response.status === 403) {
        throw new InvalidPinError();
      }

      if (!response.ok) {
        throw new PinApiError();
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw new InvalidPinResponseError();
      }

      const parsedResponse = pinApiSuccessResponseSchema.safeParse(payload);

      if (!parsedResponse.success) {
        throw new InvalidPinResponseError();
      }

      return parsedResponse.data;
    },
  };
}
