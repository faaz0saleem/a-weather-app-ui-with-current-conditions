/** Tiny CSV writer for admin exports (Excel / Google Sheets friendly). */

const NEEDS_QUOTES = /[",\r\n]/;
// Cells starting with these are treated as formulas by spreadsheet apps (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : String(value);
  if (typeof value === "string" && FORMULA_START.test(s)) s = `'${s}`;
  return NEEDS_QUOTES.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  // BOM so Excel opens UTF-8 (names in Urdu script, "Rs") correctly.
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** "2026-10-19 14:05" in Pakistan time (UTC+5, no DST). */
export function karachiStamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5 * 3_600_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}
