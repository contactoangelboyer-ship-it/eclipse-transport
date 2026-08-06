import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import fleetRouter from "./fleet";
import bookingsRouter from "./bookings";
import contactsRouter from "./contacts";
import adminRouter from "./admin";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(fleetRouter);
router.use(bookingsRouter);
router.use(contactsRouter);
router.use(adminRouter);
router.use(stripeRouter);

export default router;
