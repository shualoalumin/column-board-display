import { setupCanvasDpi } from "./setupCanvasDpi";

export function drawBackground(
  canvas: HTMLCanvasElement,
  options: { showGrid?: boolean } = {}
): CanvasRenderingContext2D {
  const ctx = setupCanvasDpi(canvas);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  ctx.fillStyle = "#1c1c1e";
  ctx.fillRect(0, 0, w, h);

  if (options.showGrid) {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    const step = 40; // CSS px grid step
    for (let x = step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  return ctx;
}
