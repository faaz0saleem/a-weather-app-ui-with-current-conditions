import { describe, expect, it } from "vitest";
import { csvCell, karachiStamp, toCsv } from "./csv";

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('Biryani, "large"')).toBe('"Biryani, ""large"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell(1250)).toBe("1250");
    expect(csvCell(null)).toBe("");
  });

  it("neutralises spreadsheet formulas in text", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+92300")).toBe("'+92300");
    expect(csvCell(-5)).toBe("-5");
  });

  it("writes a BOM and CRLF rows", () => {
    expect(toCsv(["a", "b"], [[1, "x"]])).toBe("﻿a,b\r\n1,x\r\n");
  });

  it("formats Karachi time", () => {
    expect(karachiStamp("2026-10-19T09:05:00Z")).toBe("2026-10-19 14:05");
    expect(karachiStamp(null)).toBe("");
  });
});
