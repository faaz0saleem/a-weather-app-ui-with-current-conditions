/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BRAND — the only place the name, tagline and colours are defined.
 *  Change anything here and the whole app (UI, PWA manifest, share cards,
 *  icons, emails-to-come) follows.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const brand = {
  /** Product name (working name). */
  name: "WaqtPe",
  /** The promise. Shown on the splash, login, share card and PWA description. */
  tagline: "30 minutes, or it's on us.",
  /** Short badge text on restaurant cards. */
  badge: "30 guaranteed",
  /** City / pilot area shown in copy. */
  area: "DHA Lahore",
  /** Ops phone number customers can call (shown on help screens). */
  supportPhone: "+92 300 0000000",
  /** Public marketing site (website branch). */
  websiteUrl: "https://waqtpe.pk",

  /**
   * Colours. Light + dark values. Timer colours drive the race-screen ring.
   * Rule from the brief: no pink.
   */
  colors: {
    light: {
      brand: "#F08A24", // saffron orange
      brandInk: "#1A1410", // text on brand
      brandSoft: "#FDE7CF",
      ink: "#1A1612", // deep ink — primary text
      inkSoft: "#5E554C",
      cream: "#FBF6EE", // app background
      card: "#FFFFFF",
      muted: "#F3ECE1",
      line: "#E8DFD2",
      mint: "#12B886",
      amber: "#F5A30A",
      chili: "#E03131",
      gold: "#D4A017",
      goldSoft: "#FFF3C4",
    },
    dark: {
      brand: "#F59A3C",
      brandInk: "#1A1410",
      brandSoft: "#3A2614",
      ink: "#F6EFE3",
      inkSoft: "#B5AA9C",
      cream: "#110E0B",
      card: "#1B1714",
      muted: "#26201B",
      line: "#332B24",
      mint: "#38D9A9",
      amber: "#FFC53D",
      chili: "#FF6B6B",
      gold: "#F2C94C",
      goldSoft: "#3B3014",
    },
  },
} as const;

export type BrandColors = (typeof brand.colors)["light"];
