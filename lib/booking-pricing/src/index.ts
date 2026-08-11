export const BOOKING_VEHICLES = {
  suburban: {
    name: "Chevrolet Suburban",
    ratePerMile: 6.2,
    hourlyRate: 80,
    minimumFare: 90,
  },
  escalade: {
    name: "Cadillac Escalade ESV",
    ratePerMile: 7.15,
    hourlyRate: 95,
    minimumFare: 100,
  },
  lincoln: {
    name: "Lincoln Continental",
    ratePerMile: 5.6,
    hourlyRate: 65,
    minimumFare: 80,
  },
  mercedes: {
    name: "Mercedes-Benz S-Class",
    ratePerMile: 5.6,
    hourlyRate: 75,
    minimumFare: 80,
  },
} as const;

export const BOOKING_ADDON_PRICES = {
  meetGreet: 25,
  childSeat: 20,
  flowers: 45,
  extraStop: 15,
} as const;

export type BookingPriceInput = {
  vehicleId: string;
  tripType: string;
  duration?: number;
  routeMiles?: number | null;
  addonMeetGreet?: boolean;
  addonChildSeat?: boolean;
  addonFlowers?: boolean;
  extraStops?: number;
};

export type BookingPriceBreakdown = {
  baseRate: number;
  addonsTotal: number;
  gratuity: number;
  total: number;
  minimumApplied: boolean;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateBookingPrice(input: BookingPriceInput): BookingPriceBreakdown {
  const vehicle = BOOKING_VEHICLES[input.vehicleId as keyof typeof BOOKING_VEHICLES];
  if (!vehicle) {
    return { baseRate: 0, addonsTotal: 0, gratuity: 0, total: 0, minimumApplied: false };
  }

  const isHourly = input.tripType === "By the Hour";
  const duration = Math.max(1, Number(input.duration) || 3);
  const miles = input.routeMiles == null ? null : Number(input.routeMiles);
  let baseRate = 0;
  let minimumApplied = false;

  if (isHourly) {
    baseRate = vehicle.hourlyRate * duration;
  } else if (miles != null && Number.isFinite(miles) && miles >= 0) {
    const distanceFare = vehicle.ratePerMile * miles;
    minimumApplied = distanceFare < vehicle.minimumFare;
    baseRate = minimumApplied ? vehicle.minimumFare : distanceFare;
  }

  const extraStops = Math.max(0, Math.floor(Number(input.extraStops) || 0));
  const addonsTotal =
    (input.addonMeetGreet ? BOOKING_ADDON_PRICES.meetGreet : 0) +
    (input.addonChildSeat ? BOOKING_ADDON_PRICES.childSeat : 0) +
    (input.addonFlowers ? BOOKING_ADDON_PRICES.flowers : 0) +
    extraStops * BOOKING_ADDON_PRICES.extraStop;
  const gratuity = baseRate > 0 ? roundMoney(baseRate * 0.2) : 0;

  return {
    baseRate: roundMoney(baseRate),
    addonsTotal: roundMoney(addonsTotal),
    gratuity,
    total: baseRate > 0 ? roundMoney(baseRate + addonsTotal + gratuity) : 0,
    minimumApplied,
  };
}