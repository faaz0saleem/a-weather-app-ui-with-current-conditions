import { AREAS, areaPath } from "@/config/areas";
import { brand } from "@/config/brand";
import { FAQ } from "@/config/faq";
import { abs, phaseList, rs, site } from "@/config/site";

export const dynamic = "force-static";

/** /llms.txt: a plain-text summary AI assistants can read in one request. Built from the same config as the pages. */
export function GET() {
  const body = `# ${brand.name}

> ${brand.name} is a food delivery service in DHA Lahore, Pakistan (${phaseList}). Every order carries a live 30-minute clock. If the rider has not reached the customer's gate within 30 minutes of the order being placed, the order is free, up to ${rs(site.freeCapPkr)}.

## Key facts

- Status: ${site.launched ? "taking orders" : "launching soon; not yet taking orders"}
- Delivery area: DHA Lahore ${phaseList}
- Kitchens: ${site.kitchens} at launch, in two hubs (${site.hubs.join("; ")})
- Food: ${site.foods.join(", ")}
- Menu rule: only dishes a kitchen can finish in ${site.fastLaneMin} minutes or less
- Guarantee: clock starts at "Place order", stops when the rider is within ${site.geofenceM} m of the delivery pin
- If late: order free up to ${rs(site.freeCapPkr)}; the customer pays only any amount above that
- Paused in heavy rain ("Rain Mode"), shown to the customer before ordering
- Payment: cash on delivery
- Riders never see the customer's countdown and their pay is never cut for late orders
- Contact: ${site.email}

## Pages

- [Home](${abs("/")}): overview of the service
- [The 30-minute guarantee](${abs("/guarantee/")}): how the clock works, minute by minute
- [Where we deliver](${abs("/food-delivery/")}): delivery areas
${AREAS.map((a) => `- [Food delivery in ${a.name}](${abs(areaPath(a))}): ${a.summary}`).join("\n")}
- [Questions and answers](${abs("/faq/")})
- [For restaurants](${abs("/restaurants/")}): partnering as a kitchen
- [Ride with us](${abs("/riders/")}): rider jobs
- [Terms of the guarantee](${abs("/terms/")})

## Questions and answers

${FAQ.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
