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
type Logger = Pick<Console, "info" | "warn" | "error">;

interface CreatePinApiClientOptions {
  fetchImpl?: FetchLike;
  logger?: Logger;
}

export function createPinApiClient(
  options: CreatePinApiClientOptions = {},
): PinApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const logger = options.logger ?? console;

  return {
    async verifyPin(pin: string) {
      let response: Response;

      logger.info("[pin-api] Sending upstream PIN verification request", {
        url: PIN_API_URL,
      });

      try {
        response = await fetchImpl(PIN_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pin }),
        });
      } catch {
        logger.error("[pin-api] Upstream PIN verification request failed", {
          url: PIN_API_URL,
        });
        throw new PinApiError();
      }

      logger.info("[pin-api] Upstream PIN verification response received", {
        status: response.status,
      });

      if (response.status === 403) {
        logger.warn("[pin-api] Upstream rejected PIN", {
          status: response.status,
        });
        throw new InvalidPinError();
      }

      if (!response.ok) {
        logger.error("[pin-api] Upstream returned unexpected status", {
          status: response.status,
        });
        throw new PinApiError();
      }

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        logger.error("[pin-api] Upstream returned non-JSON response body");
        throw new InvalidPinResponseError();
      }

      const parsedResponse = pinApiSuccessResponseSchema.safeParse(payload);

      if (!parsedResponse.success) {
        logger.error("[pin-api] Upstream returned invalid response payload", {
          payload,
        });
        throw new InvalidPinResponseError();
      }

      logger.info("[pin-api] Upstream PIN verification succeeded", {
        currentBalance: parsedResponse.data.currentBalance,
      });

      return parsedResponse.data;
    },
  };
}
