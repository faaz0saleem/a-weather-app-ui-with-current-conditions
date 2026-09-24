import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.auth.signIn };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : null;
  return <LoginForm next={next} />;
}
