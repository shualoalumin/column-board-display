import { setupCanvasDpi } from "./setupCanvasDpi";
import { Stroke } from "../board/boardTypes";

export function renderStrokesOnCanvas(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const ctx = setupCanvasDpi(canvas);
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  for (const stroke of strokes) {
    renderSingleStroke(ctx, stroke, scale, offsetX, offsetY);
  }
  ctx.globalCompositeOperation = "source-over";
}

export function renderSingleStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  if (stroke.points.length === 0) return;

  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
  }

  ctx.lineWidth = stroke.width * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const first = stroke.points[0];
  ctx.moveTo(offsetX + first.x * scale, offsetY + first.y * scale);

  if (stroke.points.length === 1) {
    ctx.lineTo(offsetX + first.x * scale + 0.1, offsetY + first.y * scale + 0.1);
  } else {
    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      ctx.lineTo(offsetX + pt.x * scale, offsetY + pt.y * scale);
    }
  }
  ctx.stroke();

  // Always reset after eraser
  ctx.globalCompositeOperation = "source-over";
}

// Draw one new segment during pointermove — no setState, no full redraw
export function appendStrokeSegment(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  scale: number,
  offsetX: number,
  offsetY: number,
  fromIndex: number
): void {
  if (stroke.points.length < 2 || fromIndex < 1) return;

  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
  }

  ctx.lineWidth = stroke.width * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const prev = stroke.points[fromIndex - 1];
  const curr = stroke.points[fromIndex];

  ctx.beginPath();
  ctx.moveTo(offsetX + prev.x * scale, offsetY + prev.y * scale);
  ctx.lineTo(offsetX + curr.x * scale, offsetY + curr.y * scale);
  ctx.stroke();

  ctx.globalCompositeOperation = "source-over";
}
