/**
 * A CSS-only mock of the race screen for the hero. The ring animates slowly
 * (respecting reduced motion) — no JavaScript needed on a static site.
 */
export function PhoneMock() {
  const R = 70;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative mx-auto w-[280px] motion-safe:animate-[floaty_6s_ease-in-out_infinite]" aria-hidden>
      <div className="rounded-[44px] bg-ink p-3 shadow-lift">
        <div className="overflow-hidden rounded-[34px] bg-cream">
          <div className="flex items-center justify-between px-5 pt-4 pb-2 text-[11px] font-bold">
            <span>Order WP-1024</span>
            <span className="text-brand-deep">Help</span>
          </div>
          <div className="mx-3 rounded-3xl bg-card p-4 text-center shadow-soft">
            <svg viewBox="0 0 180 180" className="mx-auto w-44 -rotate-90">
              <circle cx="90" cy="90" r={R} fill="none" stroke="var(--wp-muted)" strokeWidth="14" />
              <circle
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke="var(--wp-mint)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * 0.38}
                className="motion-safe:animate-[ring_60s_linear_infinite]"
              />
            </svg>
            <div className="-mt-[118px] mb-[58px]">
              <p className="tabular font-display text-4xl font-extrabold">18:42</p>
              <p className="text-[10px] font-bold tracking-wider text-mint-deep uppercase">left</p>
            </div>
            <p className="font-display text-sm font-bold">Khana raste mein hai!</p>
            <div className="mt-3 grid grid-cols-4 gap-1 text-[9px] font-bold">
              {["Placed", "Cooking", "On the way", "At your gate"].map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <span className={`size-5 rounded-full ${i < 3 ? "bg-brand" : "border-2 border-line bg-card"}`} />
                  <span className={i < 3 ? "" : "text-ink-soft"}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-3 my-3 flex items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
            <span className="grid size-9 place-items-center rounded-xl bg-mint/15 font-bold text-mint-deep">B</span>
            <div className="text-left">
              <p className="text-[10px] font-bold text-ink-soft uppercase">Your rider</p>
              <p className="text-xs font-bold">Bilal · Honda CD-70</p>
            </div>
            <span className="ml-auto grid size-8 place-items-center rounded-full bg-brand-soft text-xs">📞</span>
          </div>
          <div className="h-3" />
        </div>
      </div>
      <div className="absolute -top-4 -right-6 rotate-6 rounded-2xl bg-gold px-3 py-2 text-xs font-extrabold text-brand-ink shadow-lift">
        Late? It&apos;s free 🎉
      </div>
    </div>
  );
}
