import type { Metadata } from "next";
import { Legal } from "@/components/legal";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Terms" };

const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

export default function TermsPage() {
  return (
    <Legal title="Terms of the 30-minute guarantee" updated="September 2026">
      <h2>The promise</h2>
      <ul>
        <li>The clock starts when you tap <b>Place order</b> and is shown live on your screen. The app uses our server&apos;s clock, not your phone&apos;s.</li>
        <li>The clock stops when your rider taps <b>Arrived</b> within {site.geofenceM} metres of your delivery pin.</li>
        <li>If the rider hasn&apos;t arrived within 30 minutes, the order is free up to {rs(site.freeCapPkr)} (including delivery). For larger orders you pay only the amount above {rs(site.freeCapPkr)}.</li>
      </ul>
      <h2>When the guarantee doesn&apos;t apply</h2>
      <ul>
        <li><b>Rain Mode:</b> in bad weather we may pause the guarantee for everyone. This is shown clearly before you order, together with an honest estimated time.</li>
        <li>If your pin is wrong or the rider can&apos;t reach the gate for reasons outside our control, our team reviews the case.</li>
        <li>Orders cancelled or rejected before delivery are not charged.</li>
      </ul>
      <h2>Ordering</h2>
      <ul>
        <li>We only accept orders we expect to deliver in time. If we can&apos;t, the app tells you why and when to try again.</li>
        <li>Restaurants have 2 minutes to accept; otherwise the order is cancelled automatically and you are not charged.</li>
        <li>You can cancel until the restaurant accepts.</li>
        <li>Payment is cash on delivery during the pilot.</li>
      </ul>
      <h2>Contact</h2>
      <p>
        {brand.name} · {brand.area} · WhatsApp {brand.supportPhone}
      </p>
    </Legal>
  );
}
