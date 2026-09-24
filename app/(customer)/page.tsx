import Link from "next/link";
import { CloudRain, Timer, TrendingUp } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { ActiveOrderBanner } from "@/components/customer/active-order-banner";
import { AddressSwitcher } from "@/components/customer/address-switcher";
import { AutoRefresh } from "@/components/customer/auto-refresh";
import { RestaurantList } from "@/components/customer/restaurant-list";
import { t } from "@/lib/i18n";
import { getViewer } from "@/lib/server/auth";
import { getOnTimeScore, listRestaurantsWithQuotes, resolveDeliveryPoint } from "@/lib/server/catalog";
import { getActiveOrdersForCustomer } from "@/lib/server/customer-orders";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await getViewer();
  const { address, addresses, point } = await resolveDeliveryPoint(viewer?.id ?? null);
  const [{ restaurants, ctx }, score, active] = await Promise.all([
    listRestaurantsWithQuotes(point),
    getOnTimeScore(),
    viewer ? getActiveOrdersForCustomer(viewer.id) : Promise.resolve([]),
  ]);
  const firstName = viewer?.fullName.split(" ")[0] || null;
  const showScore = score.deliveries >= score.minRequired && score.avgMin != null;

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)]">
      <AutoRefresh seconds={45} />
      <header className="mb-5 flex items-center justify-between gap-3">
        <AddressSwitcher
          addresses={addresses}
          currentId={address?.id ?? null}
          signedIn={!!viewer}
        />
        <Link href={viewer ? "/profile" : "/login"} aria-label={t.nav.profile}>
          <LogoMark className="size-10" />
        </Link>
      </header>

      <h1 className="font-display text-[34px] leading-[1.05] font-extrabold">{t.home.greeting(firstName)}</h1>
      <p className="mt-1.5 mb-5 flex items-center gap-1.5 text-[15px] text-ink-soft">
        <Timer className="size-4 text-brand" /> {t.home.subGreeting}
      </p>

      {active.length > 0 && (
        <div className="mb-5 space-y-2">
          {active.map((o) => (
            <ActiveOrderBanner key={o.id} order={o} serverNow={ctx.now.getTime()} />
          ))}
        </div>
      )}

      {ctx.settings.rainMode && (
        <div className="mb-5 flex gap-3 rounded-3xl bg-ink p-4 text-cream">
          <CloudRain className="mt-0.5 size-6 shrink-0 text-brand" />
          <div>
            <p className="font-bold">{t.home.rainTitle}</p>
            <p className="text-sm text-cream/75">{t.home.rainBody}</p>
          </div>
        </div>
      )}

      {showScore && (
        <div className="mb-5 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-soft">
          <div className="grid size-12 place-items-center rounded-2xl bg-mint/15 text-mint-deep">
            <TrendingUp className="size-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{t.home.scoreTitle}</p>
            <p className="tabular font-display text-lg font-bold">
              {score.avgMin} min <span className="text-sm font-semibold text-ink-soft">{t.home.scoreAvg}</span> ·{" "}
              {score.onTimePct}% <span className="text-sm font-semibold text-ink-soft">{t.home.scoreOnTime}</span>
            </p>
            <p className="text-xs text-ink-soft">{t.home.scoreDeliveries(score.deliveries)}</p>
          </div>
        </div>
      )}

      <RestaurantList restaurants={restaurants} />
    </div>
  );
}
