import { Router, type IRouter } from "express";

const router: IRouter = Router();

const FLEET = [
  {
    id: 1,
    slug: "suburban",
    name: "Chevrolet Suburban",
    model: "2025 Suburban S",
    category: "SUV",
    maxPassengers: 7,
    maxLuggage: 6,
    flatRate: 120,
    hourlyRate: 80,
    amenities: ["High-speed Wi-Fi", "Privacy glass", "Climate control", "Bottled water", "Phone chargers"],
    imageUrl: null,
  },
  {
    id: 2,
    slug: "escalade",
    name: "Cadillac Escalade ESV",
    model: "2024 Escalade ESV",
    category: "SUV",
    maxPassengers: 7,
    maxLuggage: 6,
    flatRate: 140,
    hourlyRate: 95,
    amenities: ["Panoramic sunroof", "Premium audio", "Heated seats", "Privacy glass", "Bottled water"],
    imageUrl: null,
  },
  {
    id: 3,
    slug: "lincoln",
    name: "Lincoln Continental",
    model: "2024 Continental",
    category: "Sedan",
    maxPassengers: 3,
    maxLuggage: 3,
    flatRate: 85,
    hourlyRate: 65,
    amenities: ["Executive rear seating", "Noise cancellation", "Rear climate control", "Bottled water"],
    imageUrl: null,
  },
  {
    id: 4,
    slug: "mercedes",
    name: "Mercedes-Benz S-Class",
    model: "2024 S-Class",
    category: "Sedan",
    maxPassengers: 3,
    maxLuggage: 3,
    flatRate: 100,
    hourlyRate: 75,
    amenities: ["Ambient lighting", "Massaging seats", "Burmester audio", "Rear screens", "Bottled water"],
    imageUrl: null,
  },
];

router.get("/fleet", async (_req, res): Promise<void> => {
  res.json(FLEET);
});

export default router;
