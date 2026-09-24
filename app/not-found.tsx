import Link from "next/link";
import { EmptyState } from "@/components/customer/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-5">
      <EmptyState
        emoji="🧭"
        title="Yeh page nahi mila"
        body="That page doesn't exist — maybe the link is old."
        className="w-full"
        action={
          <Button asChild>
            <Link href="/">Back to food</Link>
          </Button>
        }
      />
    </main>
  );
}
