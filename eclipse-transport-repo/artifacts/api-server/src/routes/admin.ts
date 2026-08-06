import { Router, type IRouter, type RequestHandler } from "express";
import { createHash } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db, fleetTable, servicesTable, zonesTable, contactsTable, bookingsTable, pricingConfigTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminListFleetResponse,
  AdminCreateFleetBody,
  AdminCreateFleetResponse,
  AdminUpdateFleetParams,
  AdminUpdateFleetBody,
  AdminUpdateFleetResponse,
  AdminDeleteFleetParams,
  AdminListServicesResponse,
  AdminCreateServiceBody,
  AdminCreateServiceResponse,
  AdminUpdateServiceParams,
  AdminUpdateServiceBody,
  AdminUpdateServiceResponse,
  AdminDeleteServiceParams,
  AdminListZonesResponse,
  AdminCreateZoneBody,
  AdminCreateZoneResponse,
  AdminUpdateZoneParams,
  AdminUpdateZoneBody,
  AdminUpdateZoneResponse,
  AdminDeleteZoneParams,
  AdminListContactsResponse,
  AdminGetAnalyticsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/* ── Auth helpers ── */

// Default password — override via ADMIN_PASSWORD env var on the server
const DEFAULT_ADMIN_PASSWORD = "Eclipse#Admin2026$";

function getAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  // Simple deterministic token: SHA-256 of "eclipse-admin:" + password
  return createHash("sha256").update(`eclipse-admin:${password}`).digest("hex");
}

const adminAuth: RequestHandler = (req, res, next): void => {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${getAdminToken()}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

/* ── Login ── */

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const adminPassword = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  if (parsed.data.password !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = getAdminToken();
  res.json(AdminLoginResponse.parse({ token }));
});

/* ── Fleet CRUD ── */

router.get("/admin/fleet", adminAuth, async (req, res): Promise<void> => {
  const vehicles = await db.select().from(fleetTable).orderBy(fleetTable.id);
  res.json(AdminListFleetResponse.parse(vehicles));
});

router.post("/admin/fleet", adminAuth, async (req, res): Promise<void> => {
  const parsed = AdminCreateFleetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [vehicle] = await db.insert(fleetTable).values({
    name: parsed.data.name,
    model: parsed.data.model,
    year: parsed.data.year,
    capacity: parsed.data.capacity,
    imageUrl: parsed.data.imageUrl,
    description: parsed.data.description ?? "",
    amenities: parsed.data.amenities ?? [],
    vehicleType: parsed.data.vehicleType ?? "",
    luggageCapacity: parsed.data.luggageCapacity ?? 0,
    flatRate: parsed.data.flatRate ?? 0,
    hourlyRate: parsed.data.hourlyRate ?? 0,
  }).returning();
  res.status(201).json(AdminCreateFleetResponse.parse(vehicle));
});

router.patch("/admin/fleet/:id", adminAuth, async (req, res): Promise<void> => {
  const params = AdminUpdateFleetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateFleetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Partial<typeof fleetTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.model !== undefined) updateData.model = parsed.data.model;
  if (parsed.data.year !== undefined) updateData.year = parsed.data.year;
  if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.amenities !== undefined) updateData.amenities = parsed.data.amenities;
  if (parsed.data.vehicleType !== undefined) updateData.vehicleType = parsed.data.vehicleType;
  if (parsed.data.luggageCapacity !== undefined) updateData.luggageCapacity = parsed.data.luggageCapacity;
  if (parsed.data.flatRate !== undefined) updateData.flatRate = parsed.data.flatRate;
  if (parsed.data.hourlyRate !== undefined) updateData.hourlyRate = parsed.data.hourlyRate;
  const [vehicle] = await db.update(fleetTable).set(updateData).where(eq(fleetTable.id, params.data.id)).returning();
  if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.json(AdminUpdateFleetResponse.parse(vehicle));
});

router.delete("/admin/fleet/:id", adminAuth, async (req, res): Promise<void> => {
  const params = AdminDeleteFleetParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(fleetTable).where(eq(fleetTable.id, params.data.id)).returning();
  if (!deleted) { res.status(404).json({ error: "Vehicle not found" }); return; }
  res.status(204).send();
});

/* ── Services CRUD ── */

router.get("/admin/services", adminAuth, async (req, res): Promise<void> => {
  const services = await db.select().from(servicesTable).orderBy(servicesTable.id);
  res.json(AdminListServicesResponse.parse(services));
});

router.post("/admin/services", adminAuth, async (req, res): Promise<void> => {
  const parsed = AdminCreateServiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [service] = await db.insert(servicesTable).values({
    name: parsed.data.name,
    description: parsed.data.description,
    icon: parsed.data.icon,
    priceFrom: parsed.data.priceFrom,
    features: parsed.data.features ?? [],
  }).returning();
  res.status(201).json(AdminCreateServiceResponse.parse(service));
});

router.patch("/admin/services/:id", adminAuth, async (req, res): Promise<void> => {
  const params = AdminUpdateServiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AdminUpdateServiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Partial<typeof servicesTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon;
  if (parsed.data.priceFrom !== undefined) updateData.priceFrom = parsed.data.priceFrom;
  if (parsed.data.features !== undefined) updateData.features = parsed.data.features;
  const [service] = await db.update(servicesTable).set(updateData).where(eq(servicesTable.id, params.data.id)).returning();
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(AdminUpdateServiceResponse.parse(service));
});

router.delete("/admin/services/:id", adminAuth, async (req, res): Promise<void> => {
  const params = AdminDeleteServiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id)).returning();
  if (!deleted) { res.status(404).json({ error: "Service not found" }); return; }
  res.status(204).send();
});

/* ── Zones CRUD ── */

router.get("/admin/zones", adminAuth, async (req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable).orderBy(zonesTable.id);
  res.json(AdminListZonesResponse.parse(zones));
});

router.post("/admin/zones", adminAuth, async (req, res): Promise<void> => {
  const parsed = AdminCreateZoneBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [zone] = await db.insert(zonesTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    surcharge: parsed.data.surcharge,
    active: parsed.data.active ?? true,
  }).returning();
  res.status(201).json(AdminCreateZoneResponse.parse(zone));
});

router.patch("/admin/zones/:id", adminAuth, async (req, res): Promise<void> => {
  const params = AdminUpdateZoneParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AdminUpdateZoneBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Partial<typeof zonesTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.surcharge !== undefined) updateData.surcharge = parsed.data.surcharge;
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active;
  const [zone] = await db.update(zonesTable).set(updateData).where(eq(zonesTable.id, params.data.id)).returning();
  if (!zone) { res.status(404).json({ error: "Zone not found" }); return; }
  res.json(AdminUpdateZoneResponse.parse(zone));
});

router.delete("/admin/zones/:id", adminAuth, async (req, res): Promise<void> => {
  const params = AdminDeleteZoneParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(zonesTable).where(eq(zonesTable.id, params.data.id)).returning();
  if (!deleted) { res.status(404).json({ error: "Zone not found" }); return; }
  res.status(204).send();
});

/* ── Contacts (read-only) ── */

router.get("/admin/contacts", adminAuth, async (req, res): Promise<void> => {
  const contacts = await db.select().from(contactsTable).orderBy(contactsTable.createdAt);
  res.json(AdminListContactsResponse.parse(contacts));
});

/* ── Analytics ── */

router.get("/admin/analytics", adminAuth, async (req, res): Promise<void> => {
  // Total revenue + avg booking value + completed trips
  const [revenueRow] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(total_price), 0)`,
      avgBookingValue: sql<number>`coalesce(avg(total_price), 0)`,
      completedTrips: sql<number>`cast(count(*) as integer)`,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "completed"));

  // Monthly revenue — last 6 months
  const monthlyRows = await db.execute<{ month: string; revenue: number; bookings: number }>(
    sql`
      SELECT
        to_char(pickup_date::date, 'Mon YYYY') AS month,
        to_char(pickup_date::date, 'YYYY-MM') AS sort_key,
        coalesce(sum(total_price), 0)::float AS revenue,
        cast(count(*) as integer) AS bookings
      FROM bookings
      WHERE pickup_date::date >= (current_date - interval '6 months')
        AND status != 'cancelled'
      GROUP BY to_char(pickup_date::date, 'Mon YYYY'), to_char(pickup_date::date, 'YYYY-MM')
      ORDER BY sort_key ASC
    `
  );

  // Bookings by service type
  const serviceRows = await db.execute<{ service: string; count: number; revenue: number }>(
    sql`
      SELECT
        service_type AS service,
        cast(count(*) as integer) AS count,
        coalesce(sum(total_price), 0)::float AS revenue
      FROM bookings
      WHERE status != 'cancelled'
      GROUP BY service_type
      ORDER BY count DESC
    `
  );

  res.json(
    AdminGetAnalyticsResponse.parse({
      totalRevenue: Number(revenueRow?.totalRevenue ?? 0),
      avgBookingValue: Number(revenueRow?.avgBookingValue ?? 0),
      completedTrips: Number(revenueRow?.completedTrips ?? 0),
      monthlyRevenue: (monthlyRows.rows ?? []).map((r) => ({
        month: r.month,
        revenue: Number(r.revenue),
        bookings: Number(r.bookings),
      })),
      bookingsByService: (serviceRows.rows ?? []).map((r) => ({
        service: r.service,
        count: Number(r.count),
        revenue: Number(r.revenue),
      })),
    })
  );
});

/* ── Pricing Config (singleton, id=1) ── */

const PRICING_DEFAULTS = {
  baseRatePerMile: 3.5,
  minimumFare: 75,
  baseFare: 0,
  hourlyRate: 95,
  minimumHours: 2,
  airportPickupFlat: 0,
  airportDropoffFlat: 0,
  fuelSurcharge: 0,
  gratuityDefault: 20,
  nightSurcharge: 0,
  holidaySurcharge: 0,
  waitTimeRate: 25,
  waitTimeFreeMinutes: 15,
  additionalStopFee: 15,
};

router.get("/admin/pricing", adminAuth, async (req, res): Promise<void> => {
  let [cfg] = await db.select().from(pricingConfigTable).where(eq(pricingConfigTable.id, 1));
  if (!cfg) {
    // Seed defaults on first access
    [cfg] = await db.insert(pricingConfigTable).values({ ...PRICING_DEFAULTS }).returning();
  }
  res.json(cfg);
});

router.put("/admin/pricing", adminAuth, async (req, res): Promise<void> => {
  const body = req.body as Record<string, number>;
  const allowed = Object.keys(PRICING_DEFAULTS) as (keyof typeof PRICING_DEFAULTS)[];
  const data: Partial<typeof pricingConfigTable.$inferInsert> = {};
  for (const key of allowed) {
    if (body[key] !== undefined && !isNaN(Number(body[key]))) {
      (data as Record<string, number>)[key] = Number(body[key]);
    }
  }
  // Upsert: try update first, insert if missing
  let [cfg] = await db.update(pricingConfigTable).set({ ...data, updatedAt: new Date() }).where(eq(pricingConfigTable.id, 1)).returning();
  if (!cfg) {
    [cfg] = await db.insert(pricingConfigTable).values({ ...PRICING_DEFAULTS, ...data }).returning();
  }
  res.json(cfg);
});

export default router;
