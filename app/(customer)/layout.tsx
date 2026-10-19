import { BottomNav } from "@/components/customer/bottom-nav";
import { t } from "@/lib/i18n";

export default function CustomerLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-cream">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:p-2">
        {t.nav.skipToContent}
      </a>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
