import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SERVICES = [
  {
    id: 1,
    name: "Airport Transfer",
    description: "Stress-free rides to and from LAX, BUR, LGB, SNA, and ONT. Flight monitoring included.",
    basePrice: 120,
    icon: "Plane",
    features: ["Flight monitoring", "Meet & greet available", "All major LA airports", "24/7 dispatch"],
  },
  {
    id: 2,
    name: "Corporate Travel",
    description: "Executive black car service for meetings, roadshows, and corporate events.",
    basePrice: 95,
    icon: "Briefcase",
    features: ["Wi-Fi on board", "Privacy glass", "Hourly billing available", "Account invoicing"],
  },
  {
    id: 3,
    name: "Date Night",
    description: "Romantic 3-hour evening package — dinner, shows, or a curated night out.",
    basePrice: 250,
    icon: "Heart",
    features: ["3-hour minimum", "Champagne available", "Red carpet service", "Flexible itinerary"],
  },
  {
    id: 4,
    name: "Prom",
    description: "Safe, elegant prom transportation with red carpet arrival experience.",
    basePrice: 350,
    icon: "Car",
    features: ["Red carpet arrival", "Photo-ready vehicles", "Safe & punctual", "Group capacity"],
  },
  {
    id: 5,
    name: "Concerts & Shows",
    description: "Drop-off and pickup for all major LA venues — Staples Center, Hollywood Bowl, and more.",
    basePrice: 80,
    icon: "Music",
    features: ["All major venues", "Flexible pickup times", "No parking hassle", "Wait service available"],
  },
  {
    id: 6,
    name: "Sports Events",
    description: "Arrive and depart in style for Lakers, Rams, Dodgers, and Galaxy games.",
    basePrice: 80,
    icon: "Trophy",
    features: ["All LA stadiums", "Game-day scheduling", "Group transport", "Tailgate service"],
  },
  {
    id: 7,
    name: "Around Town",
    description: "Point-to-point transfers anywhere in Greater Los Angeles.",
    basePrice: 75,
    icon: "MapPin",
    features: ["Any destination", "Flat-rate pricing", "Luggage space", "Child seats available"],
  },
  {
    id: 8,
    name: "Wedding",
    description: "Bridal fleet service for the entire wedding party — ceremony, reception, and beyond.",
    basePrice: 400,
    icon: "Church",
    features: ["Bridal party coordination", "Decorated vehicles", "Photography-ready", "All-day packages"],
  },
  {
    id: 9,
    name: "By the Hour",
    description: "3–12 hour as-directed service — you choose the pace, we handle the driving.",
    basePrice: 80,
    icon: "Clock",
    features: ["3–12 hour blocks", "Multiple stops", "As-directed routing", "Hourly billing"],
  },
  {
    id: 10,
    name: "Air Transportation",
    description: "Private aviation transfers between fixed-base operators (FBOs) and terminals.",
    basePrice: 150,
    icon: "Wind",
    features: ["FBO transfers", "Tarmac access", "Private aviation", "On-time guarantee"],
  },
];

router.get("/services", async (_req, res): Promise<void> => {
  res.json(SERVICES);
});

export default router;
