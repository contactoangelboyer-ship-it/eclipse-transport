export const FLEET_RATES = {
  escalade: {
    id: "escalade",
    label: "Cadillac Escalade",
    baseFare: 140.00,
    baseMilesLimit: 15,
    ratePerExtraMile: 3.40,
    hourlyRate: 95,
    minimumFare: 140,
  },
  suburban: {
    id: "suburban",
    label: "Suburban",
    baseFare: 120.00,
    baseMilesLimit: 15,
    ratePerExtraMile: 2.95,
    hourlyRate: 80,
    minimumFare: 120,
  },
  sedan: {
    id: "sedan",
    label: "Luxury Sedan",
    baseFare: 100.00,
    baseMilesLimit: 15,
    ratePerExtraMile: 2.40,
    hourlyRate: 75,
    minimumFare: 100,
  },
  lincoln: {
    id: "lincoln",
    label: "Lincoln Continental",
    baseFare: 100.00,
    baseMilesLimit: 15,
    ratePerExtraMile: 2.40,
    hourlyRate: 75,
    minimumFare: 100,
  },
  mercedes: {
    id: "mercedes",
    label: "Mercedes-Benz S-Class",
    baseFare: 100.00,
    baseMilesLimit: 15,
    ratePerExtraMile: 2.40,
    hourlyRate: 75,
    minimumFare: 100,
  },
} as const;

export type FleetVehicleId = keyof typeof FLEET_RATES;

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
  const vehicle = FLEET_RATES[input.vehicleId as FleetVehicleId];
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
    if (miles <= vehicle.baseMilesLimit) {
      baseRate = vehicle.baseFare;
    } else {
      baseRate = vehicle.baseFare + (miles - vehicle.baseMilesLimit) * vehicle.ratePerExtraMile;
    }
    minimumApplied = baseRate <= vehicle.minimumFare;
    if (minimumApplied) {
      baseRate = vehicle.minimumFare;
    }
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