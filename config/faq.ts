import { brand } from "./brand";
import { phaseList, rs, site } from "./site";

export type Faq = { q: string; a: string };

/** One list of questions, used on the home page, /faq/ and in structured data. */
export const FAQ: Faq[] = [
  {
    q: "What exactly counts as late?",
    a: `The clock runs from the moment you tap Place order until your rider reaches your gate, within ${site.geofenceM} metres of your pin. If that takes more than 30 minutes, the order is free.`,
  },
  {
    q: "Is the whole order free?",
    a: `Yes, up to ${rs(site.freeCapPkr)} including delivery. On a bigger order you only pay the amount above ${rs(site.freeCapPkr)}.`,
  },
  {
    q: `Where does ${brand.name} deliver?`,
    a: `DHA Lahore ${phaseList} to begin with. Kitchens sit in two hubs, ${site.hubs.join(" and ")}, so rides stay short. More of Lahore follows once the promise holds here.`,
  },
  {
    q: "What food can I order?",
    a: `${site.foods.slice(0, -1).join(", ")} and ${site.foods.at(-1)!.toLowerCase()}. Every dish on the menu is one its kitchen can finish in ${site.fastLaneMin} minutes or less, which is what makes the 30-minute promise possible.`,
  },
  { q: "How do I pay?", a: "Cash on delivery for now. Cards and mobile wallets come later." },
  {
    q: "Why can't I order from some kitchens sometimes?",
    a: "Because we only take orders we're confident we can deliver in time. If a kitchen is too busy, too far from you, or riders are stretched, the app says so before you order, with an estimate of when to try again.",
  },
  {
    q: "What happens when it rains?",
    a: "In heavy rain we switch on Rain Mode: the timer is paused for everyone and you see an honest, longer estimate before you order. You can still order; it just doesn't carry the 30-minute promise until the roads clear.",
  },
  {
    q: "Do riders get penalised for late orders?",
    a: "Never. Riders don't see your countdown, their pay per job is fixed and never cut, and nothing in their app tells them to hurry. We'd rather give your order away than push a rider into traffic.",
  },
  {
    q: "What if the restaurant can't take my order?",
    a: "Kitchens have 2 minutes to accept. If they can't, the order is cancelled automatically, you're told straight away and you pay nothing.",
  },
  {
    q: "Do I need to download an app?",
    a: `No app store needed. ${brand.name} opens in your phone's browser and can be added to your home screen like any app.`,
  },
  {
    q: "Is the clock on my phone or yours?",
    a: "Ours. The countdown follows our server's clock, so changing the time on your phone doesn't change the deadline, and a slow phone doesn't cost you a free order.",
  },
];
