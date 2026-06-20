// Shared pen/eraser presets used by both the prototype Toolbar and the
// Samsung-Notes-style WriteToolbar.

// Dark-mode-first palette. First entry (near-white) is the default ink.
export const PEN_PALETTE = [
  "#f0f0f0",
  "#60a5fa",
  "#f87171",
  "#34d399",
  "#fbbf24",
  "#f97316",
  "#c084fc",
];

export const PEN_WIDTHS = [4, 8, 14, 22] as const;
export type PenWidth = (typeof PEN_WIDTHS)[number];

// Eraser sizes are in logical units (same space as stroke width).
export const ERASER_WIDTHS = [20, 40, 80, 140] as const;
export type EraserWidth = (typeof ERASER_WIDTHS)[number];

// "area" = pixel/disc erase (destination-out); "stroke" = erase whole strokes.
export type EraserMode = "area" | "stroke";
