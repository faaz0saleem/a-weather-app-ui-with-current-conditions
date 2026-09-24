import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/restaurants/", "/riders/", "/privacy/", "/terms/"].map((p) => ({ url: `${brand.websiteUrl}${p}`, changeFrequency: "monthly" }));
}
