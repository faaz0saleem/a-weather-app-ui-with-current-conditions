/**
 * Pakistani mobile numbers. MVP auth (D3): the phone number is the login; it's
 * mapped to an internal email for Supabase email/password auth. When real SMS
 * OTP is switched on, only lib/auth changes.
 */

/** Accepts 0300 1234567, 300-1234567, +92 300 1234567, 0092… → "+923001234567" (or null). */
export function normalizePkPhone(input: string): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  else if (d.startsWith("92") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? `+92${d}` : null;
}

/** "+923001234567" → "0300 1234567" */
export function formatPkPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const d = e164.replace(/^\+92/, "");
  return d.length === 10 ? `0${d.slice(0, 3)} ${d.slice(3)}` : e164;
}

/** "+923001234567" → "923001234567@phone.waqtpe.app" (internal only, never shown). */
export function phoneToLoginEmail(e164: string, domain: string): string {
  return `${e164.replace(/\D/g, "")}@${domain}`;
}
