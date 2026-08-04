import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  CreateBookingBody,
  UpdateBookingBody,
  GetBookingParams,
  UpdateBookingParams,
  ListBookingsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ECL-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.get("/bookings", async (req, res): Promise<void> => {
  const params = ListBookingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(bookingsTable).$dynamic();
  if (params.data.status) {
    query = query.where(eq(bookingsTable.status, params.data.status));
  }

  const bookings = await query.orderBy(bookingsTable.createdAt);
  const result = bookings.map((b) => ({
    id: b.id,
    confirmationCode: b.confirmationCode,
    tripType: b.tripType,
    vehicleId: b.vehicleId,
    passengerName: b.passengerName,
    pickupDate: b.pickupDate,
    pickupTime: b.pickupTime,
    status: b.status,
    estimatedTotal: b.estimatedTotal,
    createdAt: b.createdAt.toISOString(),
  }));
  res.json(result);
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const confirmationCode = generateConfirmationCode();
  const data = parsed.data;

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      confirmationCode,
      tripType: data.tripType,
      vehicleId: data.vehicleId,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation ?? null,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      passengers: data.passengers,
      luggage: data.luggage,
      duration: data.duration ?? null,
      extraStops: data.extraStops ?? null,
      passengerName: data.passengerName,
      passengerEmail: data.passengerEmail,
      passengerPhone: data.passengerPhone,
      addonMeetGreet: data.addonMeetGreet ?? null,
      addonChildSeat: data.addonChildSeat ?? null,
      addonFlowers: data.addonFlowers ?? null,
      addonFlightMonitor: data.addonFlightMonitor ?? null,
      specialInstructions: data.specialInstructions ?? null,
      estimatedTotal: data.estimatedTotal ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    id: booking.id,
    confirmationCode: booking.confirmationCode,
    tripType: booking.tripType,
    vehicleId: booking.vehicleId,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation ?? null,
    pickupDate: booking.pickupDate,
    pickupTime: booking.pickupTime,
    passengers: booking.passengers,
    luggage: booking.luggage,
    duration: booking.duration ?? null,
    extraStops: booking.extraStops ?? null,
    passengerName: booking.passengerName,
    passengerEmail: booking.passengerEmail,
    passengerPhone: booking.passengerPhone,
    addonMeetGreet: booking.addonMeetGreet ?? null,
    addonChildSeat: booking.addonChildSeat ?? null,
    addonFlowers: booking.addonFlowers ?? null,
    addonFlightMonitor: booking.addonFlightMonitor ?? null,
    specialInstructions: booking.specialInstructions ?? null,
    estimatedTotal: booking.estimatedTotal ?? null,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  });
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json({
    id: booking.id,
    confirmationCode: booking.confirmationCode,
    tripType: booking.tripType,
    vehicleId: booking.vehicleId,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation ?? null,
    pickupDate: booking.pickupDate,
    pickupTime: booking.pickupTime,
    passengers: booking.passengers,
    luggage: booking.luggage,
    duration: booking.duration ?? null,
    extraStops: booking.extraStops ?? null,
    passengerName: booking.passengerName,
    passengerEmail: booking.passengerEmail,
    passengerPhone: booking.passengerPhone,
    addonMeetGreet: booking.addonMeetGreet ?? null,
    addonChildSeat: booking.addonChildSeat ?? null,
    addonFlowers: booking.addonFlowers ?? null,
    addonFlightMonitor: booking.addonFlightMonitor ?? null,
    specialInstructions: booking.specialInstructions ?? null,
    estimatedTotal: booking.estimatedTotal ?? null,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  });
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json({
    id: booking.id,
    confirmationCode: booking.confirmationCode,
    tripType: booking.tripType,
    vehicleId: booking.vehicleId,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation ?? null,
    pickupDate: booking.pickupDate,
    pickupTime: booking.pickupTime,
    passengers: booking.passengers,
    luggage: booking.luggage,
    duration: booking.duration ?? null,
    extraStops: booking.extraStops ?? null,
    passengerName: booking.passengerName,
    passengerEmail: booking.passengerEmail,
    passengerPhone: booking.passengerPhone,
    addonMeetGreet: booking.addonMeetGreet ?? null,
    addonChildSeat: booking.addonChildSeat ?? null,
    addonFlowers: booking.addonFlowers ?? null,
    addonFlightMonitor: booking.addonFlightMonitor ?? null,
    specialInstructions: booking.specialInstructions ?? null,
    estimatedTotal: booking.estimatedTotal ?? null,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  });
});

export default router;
