import type { MenuSection } from "./types";

// Local-fallback menu.
//
// The real menu is owned by the Ethos dashboard and reached via
// `GET /api/public/menu`. The block below is a tiny placeholder used
// only when:
//   - the API key isn't configured yet (initial template clone),
//   - Ethos is transiently unreachable AND no cache is warm,
//   - the dashboard's menu is genuinely empty.
//
// Keep this thin. Real menus belong in the dashboard. The placeholder
// item below intentionally reads as a TODO so whoever forks this
// template populates Ethos before going live.

const PLACEHOLDER_CURRENCY = "DOP";

export const menu: MenuSection[] = [
  {
    id: "principal",
    title: { es: "Principal", en: "Main" },
    items: [
      {
        id: "placeholder",
        name: {
          es: "Agrega platos en el dashboard de Ethos",
          en: "Add dishes in the Ethos dashboard",
        },
        description: {
          es: "Una vez que cargues tu menú en Ethos, esta sección se reemplaza automáticamente con tus categorías e ítems reales.",
          en: "Once you load your menu in Ethos, this section auto-replaces with your real categories and items.",
        },
        price: 0,
        currency: PLACEHOLDER_CURRENCY,
      },
    ],
  },
];
