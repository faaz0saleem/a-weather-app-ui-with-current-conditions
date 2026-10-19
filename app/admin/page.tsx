import { LiveBoardView } from "@/components/admin/live-board";
import { getLiveBoard } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const board = await getLiveBoard();
  return <LiveBoardView initial={board} />;
}
