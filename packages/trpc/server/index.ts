import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { workspacesRouter } from "./routes/workspaces/route";
import { formsRouter } from "./routes/forms/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  workspaces: workspacesRouter,
  forms: formsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
