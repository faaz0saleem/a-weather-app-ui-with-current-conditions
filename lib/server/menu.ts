import "server-only";

import { z } from "zod";
import { optionGroupsSchema } from "@/lib/guarantee/pricing";

export const menuItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  price_pkr: z.number().int().min(1).max(100000),
  prep_min: z.number().int().min(1).max(90),
  emoji: z.string().trim().min(1).max(8).default("🍽️"),
  section_id: z.string().uuid().nullable().optional(),
  is_available: z.boolean().optional(),
  is_popular: z.boolean().optional(),
  is_active: z.boolean().optional(),
  option_groups: optionGroupsSchema.optional(),
  sort: z.number().int().optional(),
});
