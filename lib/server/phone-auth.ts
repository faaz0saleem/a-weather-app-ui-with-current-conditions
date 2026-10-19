import "server-only";

import { normalizePkPhone, phoneToLoginEmail } from "@/lib/auth/phone";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { ApiError, badRequest } from "./http";

/**
 * MVP phone + password auth (D3). Swap these two functions for
 * signInWithOtp({ phone }) / verifyOtp when SMS OTP is turned on.
 */
export const loginDomain = () => process.env.PHONE_LOGIN_DOMAIN || "phone.waqtpe.app";

export function parsePhone(raw: string): string {
  const phone = normalizePkPhone(raw);
  if (!phone) throw badRequest("invalid_phone", "Enter a Pakistani mobile number, like 0300 1234567.");
  return phone;
}

/** Sign in and set the session cookies on the response. */
export async function signInWithPhone(rawPhone: string, password: string) {
  const phone = parsePhone(rawPhone);
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: phoneToLoginEmail(phone, loginDomain()),
    password,
  });
  if (error || !data.user) throw new ApiError(401, "wrong_credentials", "That number and password don't match.");
  return data.user;
}

/** Create a customer account server-side (no confirmation email), then sign in. */
export async function signUpWithPhone(input: { phone: string; password: string; fullName: string }) {
  const phone = parsePhone(input.phone);
  if (input.password.length < 6) throw badRequest("short_password", "Password needs at least 6 characters.");
  const fullName = input.fullName.trim().slice(0, 60);
  if (!fullName) throw badRequest("name_required", "Tell us your name.");

  const admin = getServiceSupabase();
  const { data: existing } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (existing) throw new ApiError(409, "phone_taken", "This number already has an account — sign in instead.");

  const { error } = await admin.auth.admin.createUser({
    email: phoneToLoginEmail(phone, loginDomain()),
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (error) {
    if (/already|exists|registered/i.test(error.message))
      throw new ApiError(409, "phone_taken", "This number already has an account — sign in instead.");
    throw new ApiError(500, "signup_failed", error.message);
  }
  return signInWithPhone(phone, input.password);
}

/** Staff accounts (riders, kitchens) are created by admins. */
export async function createStaffAccount(input: { phone: string; password: string; fullName: string }) {
  const phone = parsePhone(input.phone);
  const admin = getServiceSupabase();
  const { data, error } = await admin.auth.admin.createUser({
    email: phoneToLoginEmail(phone, loginDomain()),
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, phone },
  });
  if (error || !data.user) {
    if (error && /already|exists|registered/i.test(error.message))
      throw new ApiError(409, "phone_taken", "This number already has an account.");
    throw new ApiError(500, "signup_failed", error?.message ?? "Could not create account");
  }
  return { id: data.user.id, phone };
}
