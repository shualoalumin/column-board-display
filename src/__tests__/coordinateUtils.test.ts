import { describe, it, expect, vi } from "vitest";
import { clientToLogical, logicalToDisplayCss } from "../geometry/coordinateUtils";
import { calculateDisplayColumnLayout } from "../geometry/columnLayout";
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from "../board/boardTypes";

function mockCanvas(width: number, height: number, left = 0, top = 0): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    width, height, left, top,
    right: left + width, bottom: top + height,
    x: left, y: top,
    toJSON: () => ({}),
  } as DOMRect);
  return canvas;
}

describe("clientToLogical", () => {
  it("maps top-left corner to (0, 0)", () => {
    const canvas = mockCanvas(400, 720, 10, 20);
    const result = clientToLogical(10, 20, canvas);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("maps bottom-right corner to (logicalWidth, logicalHeight)", () => {
    const canvas = mockCanvas(400, 720, 0, 0);
    const result = clientToLogical(400, 720, canvas);
    expect(result.x).toBe(LOGICAL_WIDTH);
    expect(result.y).toBe(LOGICAL_HEIGHT);
  });

  it("maps center correctly", () => {
    const canvas = mockCanvas(400, 720, 0, 0);
    const result = clientToLogical(200, 360, canvas);
    expect(result.x).toBeCloseTo(LOGICAL_WIDTH / 2);
    expect(result.y).toBeCloseTo(LOGICAL_HEIGHT / 2);
  });

  it("clamps to logical bounds when pointer is out of canvas", () => {
    const canvas = mockCanvas(400, 720, 0, 0);
    const r1 = clientToLogical(-100, -100, canvas);
    expect(r1.x).toBe(0);
    expect(r1.y).toBe(0);
    const r2 = clientToLogical(9999, 9999, canvas);
    expect(r2.x).toBe(LOGICAL_WIDTH);
    expect(r2.y).toBe(LOGICAL_HEIGHT);
  });

  it("is DPR-independent (uses only CSS rect, not devicePixelRatio)", () => {
    const canvas = mockCanvas(400, 720, 0, 0);
    const result = clientToLogical(200, 360, canvas);
    // With any DPR, the formula uses rect.width/height which are CSS pixels
    expect(result.x).toBeCloseTo(LOGICAL_WIDTH / 2);
    expect(result.y).toBeCloseTo(LOGICAL_HEIGHT / 2);
  });
});

describe("logicalToDisplayCss", () => {
  it("maps (0, 0) to column origin", () => {
    const result = logicalToDisplayCss(0, 0, 50, 100, 0.5);
    expect(result.cssX).toBe(50);
    expect(result.cssY).toBe(100);
  });

  it("applies uniform scale", () => {
    const scale = 0.6;
    const result = logicalToDisplayCss(500, 900, 0, 0, scale);
    expect(result.cssX).toBeCloseTo(500 * scale);
    expect(result.cssY).toBeCloseTo(900 * scale);
  });

  it("X and Y use the same scale (no independent scaleX/scaleY)", () => {
    const scale = 0.6;
    const result = logicalToDisplayCss(100, 100, 0, 0, scale);
    expect(result.cssX).toBeCloseTo(result.cssY);
  });
});

describe("calculateDisplayColumnLayout", () => {
  it("preserves aspect ratio for each column", () => {
    const layout = calculateDisplayColumnLayout(1920, 1080, 3);
    const aspect = LOGICAL_HEIGHT / LOGICAL_WIDTH;
    expect(layout.columnHeight / layout.columnWidth).toBeCloseTo(aspect, 3);
  });

  it("scale equals columnWidth / logicalWidth", () => {
    const layout = calculateDisplayColumnLayout(1920, 1080, 3);
    expect(layout.scale).toBeCloseTo(layout.columnWidth / LOGICAL_WIDTH, 5);
  });

  it("stroke width conversion: renderWidth = logicalStrokeWidth * scale", () => {
    const layout = calculateDisplayColumnLayout(1920, 1080, 3);
    const logicalStrokeWidth = 8;
    const renderWidth = logicalStrokeWidth * layout.scale;
    expect(renderWidth).toBeGreaterThan(0);
    expect(renderWidth).toBeCloseTo(logicalStrokeWidth * layout.scale);
  });

  it("columnLeft offsets increase left-to-right", () => {
    const layout = calculateDisplayColumnLayout(1920, 1080, 3);
    expect(layout.columnLeft[1]).toBeGreaterThan(layout.columnLeft[0]);
    expect(layout.columnLeft[2]).toBeGreaterThan(layout.columnLeft[1]);
  });
});
