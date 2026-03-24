import { pinRequestSchema } from "@atm/shared";
import type { NextFunction, Request, Response } from "express";

import type { AtmOrchestrator } from "../types/atm";
import { HttpError } from "../lib/http-error";

export function createAtmController(orchestrator: AtmOrchestrator) {
  return {
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
