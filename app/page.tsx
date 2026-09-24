import { CheckCircle2, XCircle } from "lucide-react";
import { brand } from "@/config/brand";
import { getViewer } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Milestone 1 system check. Replaced by the customer home in milestone 2. */
export default async function SystemCheck() {
  let restaurants = 0;
  let items = 0;
  let riders = 0;
  let error: string | null = null;
  try {
    const sb = getServiceSupabase();
    const [r, m, rd] = await Promise.all([
      sb.from("restaurants").select("id", { count: "exact", head: true }),
      sb.from("menu_items").select("id", { count: "exact", head: true }),
      sb.from("riders").select("id", { count: "exact", head: true }),
    ]);
    restaurants = r.count ?? 0;
    items = m.count ?? 0;
    riders = rd.count ?? 0;
    error = r.error?.message ?? null;
  } catch (e) {
    error = (e as Error).message;
  }
  const viewer = await getViewer().catch(() => null);
  const ok = !error && restaurants > 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <p className="text-sm font-bold tracking-widest text-brand uppercase">Milestone 1</p>
        <h1 className="font-display text-4xl font-extrabold">{brand.name}</h1>
        <p className="text-ink-soft">{brand.tagline}</p>
      </div>
      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          {ok ? <CheckCircle2 className="text-mint" /> : <XCircle className="text-chili" />}
          {ok ? "Database connected" : "Database not ready"}
        </div>
        {error && <p className="mb-2 text-sm text-chili">{error}</p>}
        <ul className="space-y-1 text-sm text-ink-soft">
          <li>{restaurants} restaurants · {items} menu items · {riders} riders</li>
          <li>Signed in as: {viewer ? `${viewer.fullName} (${viewer.role})` : "nobody — use the Dev button"}</li>
        </ul>
      </div>
      <div className="flex gap-2">
        {["bg-mint", "bg-amber", "bg-chili", "bg-gold", "bg-brand"].map((c) => (
          <div key={c} className={`h-10 flex-1 rounded-xl ${c}`} />
        ))}
      </div>
    </main>
  );
}
