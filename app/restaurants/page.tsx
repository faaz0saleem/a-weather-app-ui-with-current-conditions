import type { Metadata } from "next";
import { BarChart3, BellRing, Camera, Clock, PauseCircle, Scale } from "lucide-react";
import { PartnerPage } from "@/components/partner-page";

export const metadata: Metadata = { title: "For restaurants", description: "Partner with WaqtPe: more orders, less chaos, and a fair split clock." };

export default function RestaurantsPage() {
  return (
    <PartnerPage
      eyebrow="For DHA kitchens"
      title="More orders. Less chaos. A clock that's fair to you."
      intro="WaqtPe customers order because the 30-minute promise is real. We only send you orders your kitchen can make fast — and we only charge you when your own prep ran over."
      whatsappText="Salam! I run a restaurant in DHA and want to partner with WaqtPe."
      points={[
        { icon: BellRing, title: "A tablet dashboard that can't be missed", body: "Start your shift and new orders ring loudly until someone taps Accept. The screen stays awake." },
        { icon: Clock, title: "2 minutes to accept, your prep time", body: "Accept with a prep time you commit to, and cook against a clear countdown — no guessing." },
        { icon: Scale, title: "The split clock", body: "Late orders are split between kitchen and delivery. You're only charged when your prep ran over what you committed — never for traffic." },
        { icon: Camera, title: "Sealed-bag photo", body: "One quick photo when the order is ready. Customers love seeing their food sealed at your counter." },
        { icon: PauseCircle, title: "Busy? Pause in one tap", body: "“Back in 20 minutes” — customers are told honestly, and no order you can't handle comes in." },
        { icon: BarChart3, title: "Your day at a glance", body: "Orders, on-time %, average prep and any kitchen-caused lates, updated live." },
      ]}
      steps={["Send us your menu on WhatsApp — we'll mark which dishes cook in 12 minutes or less.", "We set up your tablet login and a 20-minute training.", "Start your first shift. We're on WhatsApp for anything."]}
    />
  );
}
