import type { MetadataRoute } from "next";
import { abs, site } from "@/config/site";

export const dynamic = "force-static";

/** Open to every search engine and AI assistant; the sitemap lists every page. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: abs("/sitemap.xml"), host: site.url };
}
