export type Locale = "es" | "en";

export type Bilingual = {
  es: string;
  en: string;
};

export type MenuItemVariant = {
  name: Bilingual;
  price: number;
};

export type MenuItem = {
  id: string;
  name: Bilingual;
  description?: Bilingual;
  note?: Bilingual;
  price?: number;
  variants?: MenuItemVariant[];
  currency: string;
  image?: string;
  tags?: string[];
};

export type MenuSection = {
  id: string;
  title: Bilingual;
  items: MenuItem[];
};

export type DayHours = {
  day: Bilingual;
  open: string | null;
  close: string | null;
};

export type Contact = {
  phone: string;
  email: string;
  address: Bilingual;
  city: Bilingual;
  googleMapsUrl: string;
  googleMapsEmbedSrc: string;
  instagram: string;
  whatsapp?: string;
};

export type Restaurant = {
  name: string;
  tagline?: Bilingual;
  slogan: Bilingual;
  about: Bilingual;
  contact: Contact;
  hours: DayHours[];
  heroImage: string;
  logo?: string;
  logoIcon?: string;
  logoWordmark?: string;
  localPhotos: string[];
  foodPhotos: string[];
};
