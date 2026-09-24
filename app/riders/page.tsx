import type { Metadata } from "next";
import { HandCoins, HeartHandshake, MapPinned, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { PartnerPage } from "@/components/partner-page";

export const metadata: Metadata = { title: "Ride with us", description: "Ride with WaqtPe in DHA Lahore: fixed pay per job, no countdown, safety first." };

export default function RidersPage() {
  return (
    <PartnerPage
      dark
      eyebrow="Riders"
      title="Ride with WaqtPe. No countdown on your screen — ever."
      intro="Our promise to customers is our problem, not yours. You never see their timer, your pay is never cut when an order is late, and nobody will tell you to hurry."
      whatsappText="Salam! I have a bike and want to ride with WaqtPe in DHA."
      points={[
        { icon: ShieldCheck, title: "Safety first, always", body: "No timers, no deadlines, no 'hurry' messages in the rider app. Ride the way you'd want your brother to ride." },
        { icon: Wallet, title: "Fixed pay per job", body: "Base pay plus per-kilometre, fixed when the job is assigned. Late order? Your pay doesn't change." },
        { icon: MapPinned, title: "Short DHA trips", body: "Jobs near the markets, drops inside DHA, one job at a time. Open in Google Maps with one tap." },
        { icon: HandCoins, title: "Simple cash", body: "The app shows exactly how much to collect in big numbers — sometimes Rs 0, when WaqtPe covers it." },
        { icon: Smartphone, title: "Any Android phone", body: "The rider app installs from the browser. You need GPS on while you're online — that's it." },
        { icon: HeartHandshake, title: "Earnings you can see", body: "Today's jobs, earnings and cash collected — all on your home screen." },
      ]}
      steps={["WhatsApp us your name, area and bike details.", "Short meet-up in DHA: documents, a helmet check and a test ride.", "Get your login, go online, and take your first job."]}
    />
  );
}
