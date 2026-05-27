import { router } from "../../trpc";
import * as crud from "./crud";
import { formsVersionsRouter } from "./versions";
import { formsPublicRouter } from "./public";
import { formsResponsesRouter } from "./responses";

export const formsRouter = router({
  create: crud.create,
  list: crud.list,
  get: crud.get,
  softDelete: crud.softDelete,
  restore: crud.restore,
  setVisibility: crud.setVisibility,
  versions: formsVersionsRouter,
  public: formsPublicRouter,
  responses: formsResponsesRouter,
});
