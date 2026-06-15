import type { Restaurant } from "./types";

// Local-fallback restaurant data.
//
// In normal operation the site reads name, tagline, address, hours,
// phone, socials, etc. from `/api/public/site-info` (Ethos) — see
// `lib/site-info.ts`. The values below are used ONLY when Ethos is
// unreachable or the API key is missing, so the site never serves a
// blank page during a backend outage or before the dashboard has
// been populated.
//
// What to edit per restaurant:
//   - Replace `name` with the working brand name (used as the document
//     title fallback and the Header/Footer text when no logo is set).
//   - If the restaurant has print collateral they want to reuse,
//     drop the SVG/PNG into `public/images/` and point `logoIcon`
//     and `logoWordmark` at it. Otherwise leave them undefined; the
//     site renders `name` as text.
//   - Keep address / phone / hours generic OR fill them with real
//     values as a belt-and-braces fallback. The Ethos dashboard
//     remains the source of truth either way.
//
// What NOT to edit:
//   - Don't add bilingual content beyond the structural fields. Real
//     content (about copy, tagline, etc.) is single-language by design
//     because the Ethos dashboard has one editor surface per field.

export const restaurant: Restaurant = {
  name: "Mi Restaurante",
  tagline: { es: "Tu lema aquí", en: "Your tagline here" },
  slogan: {
    es: "Tu lema aquí",
    en: "Your tagline here",
  },
  about: {
    es: "Cuéntale a tus comensales quién eres. Edita este texto en el dashboard de Ethos para que aparezca aquí.",
    en: "Tell your diners who you are. Edit this in the Ethos dashboard so it shows up here.",
  },
  contact: {
    phone: "+1 000 000 0000",
    email: "hola@mirestaurante.example",
    address: {
      es: "Tu dirección, Ciudad",
      en: "Your address, City",
    },
    city: {
      es: "Ciudad, País",
      en: "City, Country",
    },
    googleMapsUrl: "https://www.google.com/maps",
    // Generic embed centred on (0, 0). Restaurant overrides via dashboard.
    googleMapsEmbedSrc:
      "https://www.google.com/maps?q=0,0&output=embed",
    instagram: "https://www.instagram.com/",
    whatsapp: "+10000000000",
  },
  hours: [
    { day: { es: "Lunes", en: "Monday" }, open: "12:00", close: "22:00" },
    { day: { es: "Martes", en: "Tuesday" }, open: "12:00", close: "22:00" },
    { day: { es: "Miércoles", en: "Wednesday" }, open: "12:00", close: "22:00" },
    { day: { es: "Jueves", en: "Thursday" }, open: "12:00", close: "22:00" },
    { day: { es: "Viernes", en: "Friday" }, open: "12:00", close: "23:00" },
    { day: { es: "Sábado", en: "Saturday" }, open: "12:00", close: "23:00" },
    { day: { es: "Domingo", en: "Sunday" }, open: "12:00", close: "21:00" },
  ],
  heroImage: "/images/hero.jpg",
  logo: undefined,
  logoIcon: undefined,
  logoWordmark: undefined,
  localPhotos: ["/images/local-1.jpg", "/images/local-2.jpg"],
  foodPhotos: [
    "/images/food-1.jpg",
    "/images/food-2.jpg",
    "/images/food-3.jpg",
  ],
};
