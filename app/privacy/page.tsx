import type { Metadata } from "next";
import { Legal } from "@/components/legal";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Legal title="Privacy" updated="September 2026">
      <p>{brand.name} delivers food in {brand.area}. This page explains what we collect and why, in plain words.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Your name and mobile number — to create your account and so riders know who to look for.</li>
        <li>Your delivery addresses and map pin — to deliver, and to check an order can arrive in time.</li>
        <li>Your orders — to deliver them, show your history and handle the 30-minute guarantee.</li>
        <li>For riders only: location while you are online in the rider app — to assign nearby jobs and show customers where their food is. We don&apos;t track riders who are offline.</li>
      </ul>
      <h2>Who sees it</h2>
      <ul>
        <li>The restaurant sees your first name, your order and your note.</li>
        <li>Your rider sees your first name, phone number, address and gate note — only for your order.</li>
        <li>Our operations team can see orders to run the service and resolve problems.</li>
        <li>We don&apos;t sell your data. Share cards for free orders never include your name or address.</li>
      </ul>
      <h2>How long we keep it</h2>
      <p>Order records are kept for accounting and to handle disputes. Ask us and we&apos;ll delete your account and personal details, except records we must keep by law.</p>
      <h2>Contact</h2>
      <p>
        WhatsApp {brand.supportPhone} or email <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </Legal>
  );
}
