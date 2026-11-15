import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/seo";
import { ClosingCta, FaqList } from "@/components/site-chrome";
import { brand } from "@/config/brand";
import { FAQ } from "@/config/faq";
import { phaseList, site } from "@/config/site";

const trail = [{ name: "Questions", path: "/faq/" }];
const description = `Answers about ${brand.name}: where we deliver in DHA Lahore, what counts as late, what is free, how to pay and what happens in the rain.`;

export const metadata: Metadata = {
  title: "Questions and answers",
  description,
  alternates: { canonical: "/faq/" },
  openGraph: { url: "/faq/", title: `${brand.name} questions and answers`, description },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={[breadcrumbLd(trail), faqLd(FAQ)]} />
      <PageHero
        trail={trail}
        title={`Questions about ${brand.name}`}
        intro={`Short, straight answers about ordering food in DHA Lahore ${phaseList} and the 30-minute guarantee.`}
      />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <FaqList items={FAQ} />
        <p className="mt-8 text-ink-soft">
          Still stuck? WhatsApp us on{" "}
          <a href={`https://wa.me/${site.whatsapp}`} className="font-bold text-brand-deep underline underline-offset-4">
            {brand.supportPhone}
          </a>{" "}
          or read <Link href="/guarantee/" className="font-bold text-brand-deep underline underline-offset-4">how the guarantee works</Link>.
        </p>
      </section>
      <ClosingCta />
    </>
  );
}
