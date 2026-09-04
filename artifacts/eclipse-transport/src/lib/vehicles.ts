/**
 * Single source of truth for the Eclipse Transport vehicle catalogue.
 *
 * Both the public Fleet page (`/fleet`) and the Booking flow (`/book`) render
 * from this list, so the vehicles, names and images shown to customers are
 * always identical. Pricing mirrors `BOOKING_VEHICLES` from @workspace/booking-pricing.
 */
import suburbanImg from "@assets/generated_images/fleet-suburban.jpg";
import escaladeImg from "@assets/generated_images/fleet-escalade.jpg";
import lincolnImg from "@assets/generated_images/fleet-lincoln.jpg";
import mercedesImg from "@assets/generated_images/fleet-mercedes.jpg";
import { BOOKING_VEHICLES } from "@workspace/booking-pricing";

export interface CatalogVehicle {
  id: string;
  category: "SUVs" | "Sedans";
  name: string;
  year: string;
  model: string;
  description: string;
  capacity: number;       // max passengers
  luggage: string;         // display label, e.g. "6 bags"
  luggageCount: number;   // numeric bag count
  minimumFare: string;    // display label
  extraMileRate: string; // display label
  hourlyRate: string;    // display label
  hasWifi: boolean;
  hasPrivacy: boolean;
  hasChildSeat: boolean;
  amenities: string[];
  image: string;
  reverse: boolean;
}

const fareLabel = (v: { minimumFare: number }) => `$${v.minimumFare} base (15 miles included)`;
const extraMileLabel = (v: { ratePerMile: number }) =>
  `$${v.ratePerMile.toFixed(2)} per mile beyond 15 miles`;
const hourlyLabel = (v: { hourlyRate: number }) => `$${v.hourlyRate}/hr`;

export const VEHICLE_CATALOG: CatalogVehicle[] = [
  {
    id: "suburban",
    category: "SUVs",
    name: "Suburban",
    year: "2025",
    model: "Chevrolet Suburban S",
    description:
      "The pinnacle of understated luxury. Exceptionally spacious, impeccably maintained, and equipped for the most demanding clientele.",
    capacity: 7,
    luggage: "6 bags",
    luggageCount: 6,
    minimumFare: fareLabel(BOOKING_VEHICLES.suburban),
    extraMileRate: extraMileLabel(BOOKING_VEHICLES.suburban),
    hourlyRate: hourlyLabel(BOOKING_VEHICLES.suburban),
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: true,
    amenities: ["High-speed Wi-Fi", "Tinted Windows", "Climate Control", "Bottled Water"],
    image: suburbanImg,
    reverse: false,
  },
  {
    id: "escalade",
    category: "SUVs",
    name: "Escalade",
    year: "2024",
    model: "Cadillac Escalade ESV",
    description:
      "Commanding presence with refined interiors. Offers an unparalleled ride experience with cutting-edge technology and premium leather seating.",
    capacity: 7,
    luggage: "6 bags",
    luggageCount: 6,
    minimumFare: fareLabel(BOOKING_VEHICLES.escalade),
    extraMileRate: extraMileLabel(BOOKING_VEHICLES.escalade),
    hourlyRate: hourlyLabel(BOOKING_VEHICLES.escalade),
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: true,
    amenities: ["Panoramic Sunroof", "Premium Audio", "Heated Seats", "Privacy Glass"],
    image: escaladeImg,
    reverse: true,
  },
  {
    id: "sedan",
    category: "Sedans",
    name: "Lincoln Continental",
    year: "2024",
    model: "Lincoln Continental",
    description:
      "Classic executive elegance. A quiet, smooth journey perfect for airport transfers and corporate travel with ample legroom.",
    capacity: 3,
    luggage: "3 bags",
    luggageCount: 3,
    minimumFare: fareLabel(BOOKING_VEHICLES.sedan),
    extraMileRate: extraMileLabel(BOOKING_VEHICLES.sedan),
    hourlyRate: hourlyLabel(BOOKING_VEHICLES.sedan),
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: false,
    amenities: ["Executive Rear Seating", "Noise Cancellation", "Rear Climate Control"],
    image: lincolnImg,
    reverse: false,
  },
  {
    id: "mercedes",
    category: "Sedans",
    name: "Mercedes S-Class",
    year: "2024",
    model: "Mercedes-Benz S-Class",
    description:
      "The ultimate standard in luxury sedans. State-of-the-art safety, exquisite craftsmanship, and an extraordinarily smooth ride.",
    capacity: 3,
    luggage: "3 bags",
    luggageCount: 3,
    minimumFare: fareLabel(BOOKING_VEHICLES.mercedes),
    extraMileRate: extraMileLabel(BOOKING_VEHICLES.mercedes),
    hourlyRate: hourlyLabel(BOOKING_VEHICLES.mercedes),
    hasWifi: true,
    hasPrivacy: true,
    hasChildSeat: false,
    amenities: ["Ambient Lighting", "Massaging Seats", "Burmester Audio", "Rear Screens"],
    image: mercedesImg,
    reverse: true,
  },
];

export const getCatalogVehicle = (id?: string) =>
  VEHICLE_CATALOG.find((v) => v.id === id);
