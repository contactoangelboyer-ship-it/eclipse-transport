import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
  CancelBookingParams,
  CancelBookingResponse,
  GetBookingSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** Convert Date objects returned by Drizzle to ISO strings so Zod validators don't fail. */
function serializeBooking(booking: typeof bookingsTable.$inferSelect) {
  return {
    ...booking,
    createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
    updatedAt: booking.updatedAt instanceof Date ? (booking.updatedAt as Date).toISOString() : booking.updatedAt,
    pickupDate: typeof booking.pickupDate === "object" && booking.pickupDate !== null
      ? (booking.pickupDate as unknown as Date).toISOString().slice(0, 10)
      : booking.pickupDate,
  };
}

// Summary must come before /:id to avoid conflict
router.get("/bookings/summary", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      status: bookingsTable.status,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(bookingsTable)
    .groupBy(bookingsTable.status);

  const counts: Record<string, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  let total = 0;
  for (const row of rows) {
    counts[row.status] = row.count;
    total += row.count;
  }

  res.json(
    GetBookingSummaryResponse.parse({
      total,
      pending: counts.pending,
      confirmed: counts.confirmed,
      completed: counts.completed,
      cancelled: counts.cancelled,
    })
  );
});

router.get("/bookings", async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let rows;
  if (query.data.status) {
    rows = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.status, query.data.status))
      .orderBy(bookingsTable.createdAt);
  } else {
    rows = await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);
  }

  res.json(ListBookingsResponse.parse(rows.map(serializeBooking)));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      passengerName: parsed.data.passengerName,
      passengerEmail: parsed.data.passengerEmail,
      passengerPhone: parsed.data.passengerPhone,
      pickupLocation: parsed.data.pickupLocation,
      dropoffLocation: parsed.data.dropoffLocation,
      pickupDate: parsed.data.pickupDate,
      pickupTime: parsed.data.pickupTime,
      serviceType: parsed.data.serviceType,
      passengers: parsed.data.passengers ?? 1,
      luggage: parsed.data.luggage ?? 0,
      vehicleType: parsed.data.vehicleType ?? "",
      specialRequests: parsed.data.specialRequests ?? null,
      totalPrice: parsed.data.estimatedPrice ?? null,
      stripePaymentIntentId: parsed.data.stripePaymentIntentId ?? null,
      status: "pending",
      paymentStatus: parsed.data.stripePaymentIntentId ? "paid" : "pending",
    })
    .returning();

  res.status(201).json(CreateBookingResponse.parse(serializeBooking(booking)));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
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

  res.json(GetBookingResponse.parse(serializeBooking(booking)));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof bookingsTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.totalPrice !== undefined) updateData.totalPrice = parsed.data.totalPrice;
  if (parsed.data.specialRequests !== undefined) updateData.specialRequests = parsed.data.specialRequests;
  if (parsed.data.paymentStatus !== undefined) updateData.paymentStatus = parsed.data.paymentStatus;
  if (parsed.data.stripePaymentIntentId !== undefined) updateData.stripePaymentIntentId = parsed.data.stripePaymentIntentId;

  const [booking] = await db
    .update(bookingsTable)
    .set(updateData)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(UpdateBookingResponse.parse(serializeBooking(booking)));
});

router.patch("/bookings/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: "cancelled" })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(CancelBookingResponse.parse(serializeBooking(booking)));
});

export default router;
