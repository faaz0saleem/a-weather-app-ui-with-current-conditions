import { brand } from "./brand";

/** Site-level settings. Brand name/tagline/colours stay in config/brand.ts. */
export const site = {
  /** Where "Order now" goes — the app deployment (app branch). */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.waqtpe.pk",
  url: brand.websiteUrl,
  /**
   * Flip to true (NEXT_PUBLIC_LAUNCHED=true) the day orders open. Until then the
   * site says "launching soon" and the main button collects launch alerts on
   * WhatsApp instead of sending people to an app that isn't taking orders.
   */
  launched: process.env.NEXT_PUBLIC_LAUNCHED === "true",
  /** Google Search Console verification code (the content="" value), if any. */
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
  /** WhatsApp number for partner/rider enquiries (digits only, with country code). */
  whatsapp: brand.supportPhone.replace(/\D/g, ""),
  email: "hello@waqtpe.pk",
  city: "Lahore",
  kitchens: 10,
  /** Only dishes a kitchen can finish in this many minutes are on the menu. */
  fastLaneMin: 10,
  freeCapPkr: 3000,
  geofenceM: 75,
  phases: ["Phase 6", "Phase 7", "Phase 8"],
  hubs: ["Main Boulevard, Phase 6", "Broadway, Phase 8"],
  foods: ["Fried chicken", "Burgers", "Wraps & shawarma", "Sandwiches", "Loaded fries", "Chaat & rolls", "Coffee & breakfast"],
};

export const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;
export const phaseList = `${site.phases.slice(0, -1).join(", ").replace(/Phase /g, "").replace(/^/, "Phase ")} & ${site.phases.at(-1)!.replace("Phase ", "")}`;
export const abs = (path: string) => `${site.url}${path}`;
