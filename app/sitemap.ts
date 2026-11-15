import type { MetadataRoute } from "next";
import { AREAS, areaPath } from "@/config/areas";
import { abs } from "@/config/site";

export const dynamic = "force-static";

/** Every public page, most important first. Add a page here when you add it to the site. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({ url: abs(path), lastModified, changeFrequency, priority });
  return [
    page("/", 1, "weekly"),
    page("/guarantee/", 0.9),
    page("/food-delivery/", 0.9),
    ...AREAS.map((a) => page(areaPath(a), 0.8)),
    page("/faq/", 0.7),
    page("/restaurants/", 0.7),
    page("/riders/", 0.7),
    page("/terms/", 0.3, "yearly"),
    page("/privacy/", 0.3, "yearly"),
  ];
}
