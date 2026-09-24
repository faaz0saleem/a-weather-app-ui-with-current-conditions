import { brand } from "./brand";

/** Site-level settings. Brand name/tagline/colours stay in config/brand.ts. */
export const site = {
  /** Where "Order now" goes — the app deployment (app branch). */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.waqtpe.pk",
  url: brand.websiteUrl,
  /** WhatsApp number for partner/rider enquiries (digits only, with country code). */
  whatsapp: brand.supportPhone.replace(/\D/g, ""),
  email: "hello@waqtpe.pk",
  kitchens: 15,
  freeCapPkr: 3000,
  geofenceM: 75,
  clusters: ["Y Block, Phase 3", "CCA, Phase 5", "Main Boulevard, Phase 6"],
  cuisines: ["BBQ & tikka", "Biryani", "Burgers", "Pizza", "Broast", "Shawarma", "Pakistani-Chinese", "Nihari", "Halwa puri", "Chai & paratha", "Desserts", "Coffee"],
};
