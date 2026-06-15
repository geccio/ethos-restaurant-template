import type { Bilingual } from "@/data/types";

export type CartLine = {
  // Composite ID: `<itemId>` (no variant) or `<itemId>:<variantIndex>`.
  id: string;
  itemId: string;
  variantIndex: number | null;
  name: Bilingual;
  variantLabel: Bilingual | null;
  unitPrice: number;
  currency: string;
  qty: number;
};
