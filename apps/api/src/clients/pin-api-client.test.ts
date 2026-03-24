import { describe, expect, it, vi } from "vitest";

import { createPinApiClient } from "./pin-api-client";
import {
  InvalidPinError,
  InvalidPinResponseError,
  PinApiError,
} from "../lib/http-error";

describe("createPinApiClient", () => {
  it("returns the validated balance from the PIN API", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ currentBalance: 220 }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    const client = createPinApiClient({ fetchImpl });

    await expect(client.verifyPin("1111")).resolves.toEqual({
      currentBalance: 220,
    });
  });

  it("throws InvalidPinError on 403", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    const client = createPinApiClient({ fetchImpl });

    await expect(client.verifyPin("9999")).rejects.toBeInstanceOf(InvalidPinError);
  });

  it("throws PinApiError on other non-ok responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const client = createPinApiClient({ fetchImpl });

    await expect(client.verifyPin("1111")).rejects.toBeInstanceOf(PinApiError);
  });

  it("throws InvalidPinResponseError on malformed response bodies", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ currentBalance: "220" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    const client = createPinApiClient({ fetchImpl });

    await expect(client.verifyPin("1111")).rejects.toBeInstanceOf(
      InvalidPinResponseError,
    );
  });

  it("throws PinApiError when the network request fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("socket hang up"));
    const client = createPinApiClient({ fetchImpl });

    await expect(client.verifyPin("1111")).rejects.toBeInstanceOf(PinApiError);
  });
});
