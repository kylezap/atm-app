import { describe, expect, it, vi } from "vitest";

import { createPinService } from "./pin-service";
import type { PinApiClient } from "../clients/pin-api-client";
import { InvalidPinError } from "../lib/http-error";

describe("createPinService", () => {
  it("verifies upstream once and then returns the locally updated balance", async () => {
    const client: PinApiClient = {
      verifyPin: vi.fn().mockResolvedValue({ currentBalance: 220 }),
    };
    const service = createPinService(client);

    expect(await service.authenticate("1111")).toEqual({ currentBalance: 220 });

    service.setCurrentBalance(180);

    expect(await service.authenticate("1111")).toEqual({ currentBalance: 180 });
    expect(client.verifyPin).toHaveBeenCalledTimes(1);
  });

  it("stores recent transactions in runtime memory", async () => {
    const client: PinApiClient = {
      verifyPin: vi.fn().mockResolvedValue({ currentBalance: 220 }),
    };
    const service = createPinService(client);
    const transaction = {
      amount: 40,
      status: "success" as const,
      dispensedNotes: { 5: 0, 10: 0, 20: 2 },
      balanceBefore: 220,
      balanceAfter: 180,
      overdraftWarning: false,
      remainingNotes: { 5: 4, 10: 15, 20: 5 },
    };

    await service.authenticate("1111");
    service.recordTransaction(transaction);

    expect(service.getRecentTransactions()).toEqual([transaction]);
  });

  it("re-verifies upstream when a different PIN is provided", async () => {
    const client: PinApiClient = {
      verifyPin: vi
        .fn()
        .mockResolvedValueOnce({ currentBalance: 220 })
        .mockRejectedValueOnce(new InvalidPinError()),
    };
    const service = createPinService(client);

    expect(await service.authenticate("1111")).toEqual({ currentBalance: 220 });
    await expect(service.authenticate("9999")).rejects.toBeInstanceOf(InvalidPinError);
    expect(client.verifyPin).toHaveBeenCalledTimes(2);
    expect(client.verifyPin).toHaveBeenNthCalledWith(1, "1111");
    expect(client.verifyPin).toHaveBeenNthCalledWith(2, "9999");
  });
});
