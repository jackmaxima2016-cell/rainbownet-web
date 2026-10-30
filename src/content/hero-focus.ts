// Focal point (object-position) per hero image, chosen for a portrait/mobile crop.
// x/y are percentages of the source image; used for every viewport so the subject
// stays protected instead of relying on a blind "center" crop.
export const HERO_FOCUS: Record<string, { x: number; y: number; dark?: boolean }> = {
  'hero-geneva': { x: 50, y: 42 },
  'about-geneva': { x: 50, y: 42 },
  'geneva-city': { x: 50, y: 50 },
  'approach-desk': { x: 46, y: 45 },
  'confidentiality': { x: 48, y: 52 },
  'contact-office': { x: 56, y: 50 },
  'corporate-investigations': { x: 55, y: 48, dark: true },
  'europe-coverage': { x: 56, y: 50 },
  'pricing-hero': { x: 50, y: 52, dark: true },
  'city-amsterdam': { x: 54, y: 40 },
  'city-berlin': { x: 62, y: 44 },
  'city-brussels': { x: 55, y: 46 },
  'city-lisbon': { x: 64, y: 43 },
  'city-london': { x: 58, y: 66, dark: true },
  'city-luxembourg': { x: 45, y: 42 },
  'city-madrid': { x: 50, y: 50 },
  'city-paris': { x: 45, y: 44 },
  'city-rome': { x: 50, y: 46 },
  'city-vienna': { x: 50, y: 46 },
  'service-corporate': { x: 50, y: 45 },
  'service-individuals': { x: 70, y: 58 },
  'service-international': { x: 50, y: 56 },
  'service-legal': { x: 60, y: 52 },
};
