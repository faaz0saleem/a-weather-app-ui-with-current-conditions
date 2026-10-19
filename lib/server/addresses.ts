import "server-only";

import { z } from "zod";
import { GATE_NOTE_KINDS } from "@/config/dha";

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(30).default("Home"),
  phase: z.string().trim().min(1).max(40),
  block: z.string().trim().min(1).max(40),
  house_no: z.string().trim().min(1).max(40),
  street: z.string().trim().max(80).nullable().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  gate_note_kind: z.enum(GATE_NOTE_KINDS),
  gate_note: z.string().trim().max(200).nullable().optional(),
  is_default: z.boolean().optional(),
});
