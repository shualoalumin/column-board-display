import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from "../board/boardTypes";

// Convert CSS pixel pointer position → logical coordinates
export function clientToLogical(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  logicalWidth = LOGICAL_WIDTH,
  logicalHeight = LOGICAL_HEIGHT
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(logicalWidth,
    ((clientX - rect.left) * logicalWidth) / rect.width
  ));
  const y = Math.max(0, Math.min(logicalHeight,
    ((clientY - rect.top) * logicalHeight) / rect.height
  ));
  return { x, y };
}

// Convert logical coordinates → CSS pixel position on teacher canvas
export function logicalToTeacherCss(
  logicalX: number,
  logicalY: number,
  canvasRect: DOMRect,
  logicalWidth = LOGICAL_WIDTH,
  logicalHeight = LOGICAL_HEIGHT
): { cssX: number; cssY: number } {
  const scale = Math.min(
    canvasRect.width / logicalWidth,
    canvasRect.height / logicalHeight
  );
  const offsetX = (canvasRect.width - logicalWidth * scale) / 2;
  const offsetY = (canvasRect.height - logicalHeight * scale) / 2;
  return {
    cssX: offsetX + logicalX * scale,
    cssY: offsetY + logicalY * scale,
  };
}

// Convert logical coordinates → CSS pixel position on display column
export function logicalToDisplayCss(
  logicalX: number,
  logicalY: number,
  columnLeft: number,  // CSS px
  columnTop: number,   // CSS px
  scale: number        // CSS px per logical unit
): { cssX: number; cssY: number } {
  return {
    cssX: columnLeft + logicalX * scale,
    cssY: columnTop + logicalY * scale,
  };
}
