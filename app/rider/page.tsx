import { RiderApp } from "@/components/rider/rider-app";
import { getViewer } from "@/lib/server/auth";
import { getRiderState } from "@/lib/server/rider";

export const dynamic = "force-dynamic";

export default async function RiderPage() {
  const viewer = (await getViewer())!;
  const state = await getRiderState(viewer.id);
  return <RiderApp initial={state} />;
}
