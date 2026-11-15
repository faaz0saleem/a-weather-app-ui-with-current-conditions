import { brand } from "./brand";
import type { Faq } from "./faq";
import { site } from "./site";

export type Area = {
  slug: string;
  name: string;
  /** One line for cards and meta descriptions. */
  summary: string;
  /** Where the food for this phase is cooked. */
  hub: string;
  source: string;
  ride: string;
  note: string;
  faq: Faq[];
};

/** One page per phase we serve. Keep every claim true for that phase. */
export const AREAS: Area[] = [
  {
    slug: "dha-phase-6",
    name: "DHA Phase 6",
    summary: "Our home hub. Kitchens along Main Boulevard cook inside the phase, so rides are the shortest we do.",
    hub: site.hubs[0],
    source:
      "Most of our launch kitchens sit inside Phase 6, around Main Boulevard and the sector commercial markets. Your food is cooked a few minutes from your gate, not across the city.",
    ride: "Rides inside Phase 6 are the shortest on the network, which leaves the kitchen most of the 30 minutes.",
    note: "Phase 6 gets the widest choice of kitchens at launch, because every one of them on this side is within range.",
    faq: [
      {
        q: "Which part of DHA Phase 6 do you cover?",
        a: `The whole phase is inside our delivery zone. The app checks your exact pin: you see every kitchen that can reach your gate inside the 30 minutes, with a live estimate for each.`,
      },
      {
        q: "How late do you deliver in Phase 6?",
        a: "Each kitchen sets its own hours and the app shows them. When a kitchen is closed it says when it opens again, and you can't place an order it can't cook.",
      },
    ],
  },
  {
    slug: "dha-phase-7",
    name: "DHA Phase 7",
    summary: "Served from the Phase 6 hub next door. The app only shows kitchens that can still reach your gate in time.",
    hub: site.hubs[0],
    source:
      "There are no launch kitchens inside Phase 7 yet, so your food comes from the Phase 6 hub next door. That is a longer ride than a Phase 6 order, and the app accounts for it before it lets you order.",
    ride: "Before you order, we work out the ride to your pin. A kitchen only appears if cooking plus the ride fits inside 30 minutes with time to spare.",
    note: "At busy hours the farther sectors of Phase 7 may see fewer kitchens. That is the app refusing orders it might lose, not a fault.",
    faq: [
      {
        q: "Do you deliver to all of DHA Phase 7?",
        a: "Phase 7 is inside our zone, and what you can order depends on your pin. Close to Phase 6 you see nearly everything; farther out, only the kitchens that can make it in time.",
      },
      {
        q: "Does the 30-minute guarantee apply in Phase 7?",
        a: `Yes. Every order ${brand.name} accepts in Phase 7 carries the same promise: at your gate in 30 minutes or the order is free.`,
      },
    ],
  },
  {
    slug: "dha-phase-8",
    name: "DHA Phase 8",
    summary: "Its own hub around Broadway, so Phase 8 orders are cooked in Phase 8.",
    hub: site.hubs[1],
    source:
      "Phase 8 has its own hub around Broadway commercial and the Air Avenue side. Orders here are cooked in Phase 8 and don't cross over from Phase 6.",
    ride: "Riders wait near the Broadway kitchens between jobs, so pickup starts the moment your food is packed.",
    note: "Phase 8 launches with a smaller set of kitchens than Phase 6. We add more as they pass our prep-time test.",
    faq: [
      {
        q: "Do you deliver to Air Avenue and Broadway in Phase 8?",
        a: "Yes, both are inside the Phase 8 zone. Drop your pin and the app shows the kitchens that can reach you in time.",
      },
      {
        q: "Why are there fewer restaurants in Phase 8 than Phase 6?",
        a: `We only list a kitchen after timing real orders at its counter. Each one has to hand food over in ${site.fastLaneMin} minutes or less, three times in a row, before it gets the 30-minute badge.`,
      },
    ],
  },
];

export const areaPath = (a: Area) => `/food-delivery/${a.slug}/`;
