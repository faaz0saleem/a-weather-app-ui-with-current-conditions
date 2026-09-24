import "server-only";

import { DEV_TOOLS } from "@/lib/supabase/env";
import { ApiError } from "./http";

/** Dev endpoints exist only when NEXT_PUBLIC_DEV_TOOLS=true (never in production). */
export function requireDevTools() {
  if (!DEV_TOOLS) throw new ApiError(404, "not_found", "Not found");
}
