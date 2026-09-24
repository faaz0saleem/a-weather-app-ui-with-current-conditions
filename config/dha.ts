/**
 * DHA Lahore reference data for the address picker. Approximate — edit freely.
 * Coordinates are [lat, lng]. The *live* delivery zone lives in the `zones`
 * table (editable in /admin/zone); DEFAULT_ZONE is only what the seed inserts.
 */
export type DhaPhase = {
  name: string;
  /** Rough centre, used to drop the map pin before the customer drags it. */
  center: [number, number];
  blocks: string[];
};

export const DHA_PHASES: DhaPhase[] = [
  { name: "Phase 1", center: [31.4785, 74.3895], blocks: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P"] },
  { name: "Phase 2", center: [31.4725, 74.4005], blocks: ["Q", "R", "S", "T", "U", "V"] },
  { name: "Phase 3", center: [31.4770, 74.3820], blocks: ["W", "X", "XX", "Y", "Z"] },
  { name: "Phase 4", center: [31.4635, 74.3900], blocks: ["AA", "BB", "CC", "DD", "EE", "FF", "GG", "HH"] },
  { name: "Phase 5", center: [31.4610, 74.4120], blocks: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"] },
  { name: "Phase 6", center: [31.4740, 74.4470], blocks: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N"] },
  { name: "Phase 7", center: [31.4480, 74.4420], blocks: ["P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"] },
  { name: "Phase 8", center: [31.4890, 74.4560], blocks: ["Air Avenue", "Broadway", "Ex Air Avenue", "Park View"] },
];

/** Where the map opens (and where signed-out browsers' ETAs are measured from). */
export const DHA_DEFAULT_CENTER: [number, number] = [31.4697, 74.4115];

/** Seeded delivery zone — roughly DHA Phases 1–8. Edit live in /admin/zone. */
export const DEFAULT_ZONE: [number, number][] = [
  [31.4960, 74.3700],
  [31.4985, 74.4150],
  [31.4960, 74.4620],
  [31.4840, 74.4800],
  [31.4560, 74.4780],
  [31.4400, 74.4500],
  [31.4410, 74.4050],
  [31.4530, 74.3720],
  [31.4720, 74.3620],
];

export const GATE_NOTE_KINDS = ["guard", "bell", "call", "custom"] as const;
export type GateNoteKind = (typeof GATE_NOTE_KINDS)[number];
