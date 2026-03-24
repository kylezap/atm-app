import { Router } from "express";

import { createAtmController } from "../controllers/atm-controller";
import type { AtmOrchestrator } from "../types/atm";

export function createAtmRoutes(orchestrator: AtmOrchestrator) {
  const router = Router();
  const controller = createAtmController(orchestrator);

  router.post("/session", controller.createSession);

  return router;
}
