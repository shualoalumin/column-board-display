import { Stroke } from "../board/boardTypes";

// All coordinates here are in logical units (same space as Stroke points/width).

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Returns true if the eraser disc (center px,py radius) touches the stroke,
// accounting for the stroke's own half-width.
export function strokeHitsPoint(
  stroke: Stroke,
  px: number,
  py: number,
  radius: number
): boolean {
  if (stroke.tool === "eraser") return false; // don't erase eraser strokes
  const pts = stroke.points;
  if (pts.length === 0) return false;
  const threshold = radius + stroke.width / 2;

  if (pts.length === 1) {
    return Math.hypot(pts[0].x - px, pts[0].y - py) <= threshold;
  }
  for (let i = 1; i < pts.length; i++) {
    const d = distanceToSegment(px, py, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    if (d <= threshold) return true;
  }
  return false;
}
