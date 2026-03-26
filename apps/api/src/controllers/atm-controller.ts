import { pinRequestSchema, pinVerificationRequestSchema } from "@atm/shared";
import type { NextFunction, Request, Response } from "express";

import type { AtmOrchestrator } from "../types/atm";
import { HttpError } from "../lib/http-error";
import type { PinService } from "../services/pin-service";

// Controller is responsible for parsing the request, validating the data, and orchestrating the business logic.
// It is the entry point for the ATM application and is responsible for handling the request and response.

export function createAtmController(
  orchestrator: AtmOrchestrator,
  pinService: PinService,
) {
  return {
    async verifyPin(request: Request, response: Response, next: NextFunction) {
      const parsedRequest = pinVerificationRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        next(new HttpError(400, "Invalid request body."));
        return;
      }

      try {
        const authenticationResult = await pinService.authenticate(parsedRequest.data.pin);
        response.status(200).json({
          authenticated: true,
          currentBalance: authenticationResult.currentBalance,
          recentTransactions: pinService.getRecentTransactions(),
        });
      } catch (error) {
        next(error);
      }
    },

    async createSession(
      request: Request,
      response: Response,
      next: NextFunction,
    ) {
      const parsedRequest = pinRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        next(new HttpError(400, "Invalid request body."));
        return;
      }

      try {
        const sessionSummary = await orchestrator.processSession(parsedRequest.data);
        response.status(200).json(sessionSummary);
      } catch (error) {
        next(error);
      }
    },
  };
}
