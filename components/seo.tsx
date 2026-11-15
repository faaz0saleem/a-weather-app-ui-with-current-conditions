import Link from "next/link";
import { brand } from "@/config/brand";
import type { Faq } from "@/config/faq";
import { abs, site } from "@/config/site";

/** Structured data for search engines and AI assistants. Rendered as a script tag, no client JS. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const ORG_ID = abs("/#organization");

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: brand.name,
  url: abs("/"),
  logo: abs("/icon"),
  slogan: brand.tagline,
  description: `Food delivery in ${brand.area} with a live 30-minute clock on every order. If the rider is late, the order is free.`,
  email: site.email,
  areaServed: site.phases.map((p) => ({ "@type": "Place", name: `DHA ${p}, ${site.city}, Pakistan` })),
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": abs("/#website"),
  name: brand.name,
  url: abs("/"),
  inLanguage: "en-PK",
  publisher: { "@id": ORG_ID },
};

export function serviceLd(areaName?: string, path = "/") {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Food delivery",
    name: areaName ? `${brand.name} food delivery in ${areaName}` : `${brand.name} 30-minute food delivery`,
    url: abs(path),
    provider: { "@id": ORG_ID },
    areaServed: areaName
      ? { "@type": "Place", name: `${areaName}, ${site.city}, Pakistan` }
      : site.phases.map((p) => ({ "@type": "Place", name: `DHA ${p}, ${site.city}, Pakistan` })),
    description: `Food delivered in 30 minutes or the order is free, up to Rs ${site.freeCapPkr.toLocaleString("en-US")}.`,
  };
}

export function faqLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: abs(t.path) })),
  };
}

/** Visible breadcrumb trail that matches the structured data. */
export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm font-semibold opacity-80">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="underline-offset-4 hover:underline">
            Home
          </Link>
        </li>
        {trail.map((t, i) => (
          <li key={t.path} className="flex items-center gap-2">
            <span aria-hidden>/</span>
            {i === trail.length - 1 ? (
              <span aria-current="page">{t.name}</span>
            ) : (
              <Link href={t.path} className="underline-offset-4 hover:underline">
                {t.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
