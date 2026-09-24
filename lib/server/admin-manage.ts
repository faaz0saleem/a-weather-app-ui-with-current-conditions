import "server-only";

import { z } from "zod";

export const restaurantSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers and dashes"),
  tagline: z.string().trim().max(120).default(""),
  cuisines: z.array(z.string().trim().min(1).max(30)).max(6).default([]),
  cluster: z.string().trim().max(60).default(""),
  address: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(20).nullable().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius_km: z.number().min(0.5).max(30).nullable().optional(),
  opens_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  closes_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  hero_emoji: z.string().trim().min(1).max(8).default("🍽️"),
  hero_from: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#F08A24"),
  hero_to: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7A2E0E"),
  is_active: z.boolean().optional(),
  is_accepting: z.boolean().optional(),
});

export const staffSchema = z.object({
  fullName: z.string().trim().min(2).max(60),
  phone: z.string().min(5).max(20),
  password: z.string().min(6).max(128),
});

export const riderCreateSchema = staffSchema.extend({
  vehicle: z.string().trim().max(40).default("Bike"),
  plate: z.string().trim().max(20).nullable().optional(),
});

export const riderPatchSchema = z.object({
  is_active: z.boolean().optional(),
  vehicle: z.string().trim().max(40).optional(),
  plate: z.string().trim().max(20).nullable().optional(),
  forceOffline: z.boolean().optional(),
});
