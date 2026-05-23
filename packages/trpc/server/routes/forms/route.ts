import { router } from "../../trpc";
import * as crud from "./crud";
import { formsVersionsRouter } from "./versions";
import { formsPublicRouter } from "./public";

export const formsRouter = router({
  create: crud.create,
  list: crud.list,
  get: crud.get,
  softDelete: crud.softDelete,
  restore: crud.restore,
  versions: formsVersionsRouter,
  public: formsPublicRouter,
});
