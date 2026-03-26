import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "./app";
import {
  InvalidPinError,
  InvalidPinResponseError,
  PinApiError,
} from "./lib/http-error";
import type { PinService } from "./services/pin-service";
import type { AtmOrchestrator } from "./types/atm";

describe("createApp", () => {
  it("returns ok from the health endpoint", async () => {
    const app = createApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns 400 for an invalid ATM session request body", async () => {
    const orchestrator: AtmOrchestrator = {
      processSession: vi.fn(),
    };
    const app = createApp({ orchestrator });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Invalid request body." });
    expect(orchestrator.processSession).not.toHaveBeenCalled();
  });

  it("verifies a PIN immediately through the ATM pin endpoint", async () => {
    const pinService: PinService = {
      authenticate: vi.fn().mockResolvedValue({ currentBalance: 220 }),
      signOut: vi.fn(),
      setCurrentBalance: vi.fn(),
      getRecentTransactions: vi.fn().mockReturnValue([
        {
          amount: 40,
          status: "success",
          dispensedNotes: { 5: 0, 10: 0, 20: 2 },
          balanceBefore: 220,
          balanceAfter: 180,
          overdraftWarning: false,
          remainingNotes: { 5: 4, 10: 15, 20: 5 },
        },
      ]),
      recordTransaction: vi.fn(),
    };
    const app = createApp({ pinService });

    const response = await request(app).post("/api/atm/pin").send({ pin: "1111" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authenticated: true,
      currentBalance: 220,
      recentTransactions: [
        {
          amount: 40,
          status: "success",
          dispensedNotes: { 5: 0, 10: 0, 20: 2 },
          balanceBefore: 220,
          balanceAfter: 180,
          overdraftWarning: false,
          remainingNotes: { 5: 4, 10: 15, 20: 5 },
        },
      ],
    });
    expect(pinService.authenticate).toHaveBeenCalledWith("1111");
  });

  it("returns 403 from the immediate PIN endpoint when the PIN is invalid", async () => {
    const app = createApp({
      pinService: {
        authenticate: vi.fn().mockRejectedValue(new InvalidPinError()),
        signOut: vi.fn(),
        setCurrentBalance: vi.fn(),
        getRecentTransactions: vi.fn().mockReturnValue([]),
        recordTransaction: vi.fn(),
      },
    });

    const response = await request(app).post("/api/atm/pin").send({ pin: "9999" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Invalid PIN." });
  });

  it("returns the session summary for a valid ATM request", async () => {
    const orchestrator: AtmOrchestrator = {
      processSession: vi.fn().mockResolvedValue({
        authenticated: true,
        startingBalance: 220,
        withdrawals: [],
        endingBalance: 220,
        remainingNotes: { 5: 4, 10: 15, 20: 7 },
        recentTransactions: [],
      }),
    };
    const app = createApp({ orchestrator });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111", withdrawals: [140, 50, 90] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authenticated: true,
      startingBalance: 220,
      withdrawals: [],
      endingBalance: 220,
      remainingNotes: { 5: 4, 10: 15, 20: 7 },
      recentTransactions: [],
    });
    expect(orchestrator.processSession).toHaveBeenCalledWith({
      pin: "1111",
      withdrawals: [140, 50, 90],
    });
  });

  it("logs out without clearing tracked account state", async () => {
    const pinService: PinService = {
      authenticate: vi.fn(),
      signOut: vi.fn(),
      setCurrentBalance: vi.fn(),
      getRecentTransactions: vi.fn().mockReturnValue([]),
      recordTransaction: vi.fn(),
    };
    const app = createApp({ pinService });

    const response = await request(app).post("/api/atm/logout").send();

    expect(response.status).toBe(204);
    expect(pinService.signOut).toHaveBeenCalledTimes(1);
  });

  it("returns 403 when the PIN is invalid", async () => {
    const orchestrator: AtmOrchestrator = {
      processSession: vi.fn().mockRejectedValue(new InvalidPinError()),
    };
    const app = createApp({ orchestrator });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "9999", withdrawals: [140] });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Invalid PIN." });
  });

  it("returns 502 for upstream PIN API failures", async () => {
    const app = createApp({
      orchestrator: {
        processSession: vi.fn().mockRejectedValue(new PinApiError()),
      },
    });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111", withdrawals: [140] });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ message: "Unable to verify PIN." });
  });

  it("returns 502 for malformed successful PIN API responses", async () => {
    const app = createApp({
      orchestrator: {
        processSession: vi
          .fn()
          .mockRejectedValue(new InvalidPinResponseError()),
      },
    });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111", withdrawals: [140] });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ message: "Unable to verify PIN." });
  });
});
