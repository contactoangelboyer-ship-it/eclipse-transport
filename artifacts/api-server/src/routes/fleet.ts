import { Router, type IRouter } from "express";
import { db, fleetTable } from "@workspace/db";
import { ListFleetResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fleet", async (req, res): Promise<void> => {
  const vehicles = await db.select().from(fleetTable).orderBy(fleetTable.id);
  res.json(ListFleetResponse.parse(vehicles));
});

export default router;
