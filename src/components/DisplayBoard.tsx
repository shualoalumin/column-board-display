import React, { useCallback, useEffect, useRef } from "react";
import { BoardState, Stroke } from "../board/boardTypes";
import { setupCanvasDpi } from "../canvas/setupCanvasDpi";
import { renderSingleStroke } from "../canvas/strokeRenderUtils";
import { calculateDisplayColumnLayout } from "../geometry/columnLayout";

interface Props {
  boardState: BoardState;
  showActiveHighlight?: boolean;
  // In-progress stroke streamed live from the teacher (rendered on top).
  liveStroke?: Stroke | null;
}

export const DisplayBoard: React.FC<Props> = ({ boardState, showActiveHighlight = true, liveStroke = null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const strokeCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const redraw = useCallback(() => {
    const container = containerRef.current;
    const bgCanvas = bgCanvasRef.current;
    const strokeCanvas = strokeCanvasRef.current;
    if (!container || !bgCanvas || !strokeCanvas) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const { columns, activeColumnId } = boardState;
    const layout = calculateDisplayColumnLayout(rect.width, rect.height, columns.length);

    [bgCanvas, strokeCanvas].forEach((c) => {
      c.style.width = `${rect.width}px`;
      c.style.height = `${rect.height}px`;
    });

    // Background
    const bgCtx = setupCanvasDpi(bgCanvas);
    bgCtx.fillStyle = "#1c1c1e";
    bgCtx.fillRect(0, 0, rect.width, rect.height);

    columns.forEach((_, i) => {
      bgCtx.fillStyle = "#1c1c1e";
      bgCtx.fillRect(layout.columnLeft[i], layout.columnTop[i], layout.columnWidth, layout.columnHeight);

      // Subtle grid for dark mode
      bgCtx.strokeStyle = "rgba(255,255,255,0.04)";
      bgCtx.lineWidth = 0.5;
      const step = 40 * layout.scale;
      for (let x = step; x < layout.columnWidth; x += step) {
        bgCtx.beginPath();
        bgCtx.moveTo(layout.columnLeft[i] + x, layout.columnTop[i]);
        bgCtx.lineTo(layout.columnLeft[i] + x, layout.columnTop[i] + layout.columnHeight);
        bgCtx.stroke();
      }
      for (let y = step; y < layout.columnHeight; y += step) {
        bgCtx.beginPath();
        bgCtx.moveTo(layout.columnLeft[i], layout.columnTop[i] + y);
        bgCtx.lineTo(layout.columnLeft[i] + layout.columnWidth, layout.columnTop[i] + y);
        bgCtx.stroke();
      }

      // Column divider line (between columns)
      if (i > 0) {
        bgCtx.strokeStyle = "rgba(255,255,255,0.12)";
        bgCtx.lineWidth = 1;
        bgCtx.beginPath();
        bgCtx.moveTo(layout.columnLeft[i], layout.columnTop[i]);
        bgCtx.lineTo(layout.columnLeft[i], layout.columnTop[i] + layout.columnHeight);
        bgCtx.stroke();
      }
    });

    // Strokes
    const strokeCtx = setupCanvasDpi(strokeCanvas);
    strokeCtx.clearRect(0, 0, rect.width, rect.height);

    columns.forEach((col, i) => {
      for (const stroke of col.strokes) {
        renderSingleStroke(strokeCtx, stroke, layout.scale, layout.columnLeft[i], layout.columnTop[i]);
      }
    });

    // Live in-progress stroke, rendered on top in its own column.
    if (liveStroke) {
      const li = columns.findIndex((c) => c.id === liveStroke.columnId);
      if (li >= 0) {
        renderSingleStroke(strokeCtx, liveStroke, layout.scale, layout.columnLeft[li], layout.columnTop[li]);
      }
    }
    strokeCtx.globalCompositeOperation = "source-over";

    // Overlay: active column border
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.innerHTML = "";
      if (showActiveHighlight) {
        const activeIdx = columns.findIndex((c) => c.id === activeColumnId);
        if (activeIdx >= 0) {
          const border = document.createElement("div");
          border.style.cssText = `
            position:absolute;
            left:${layout.columnLeft[activeIdx]}px;
            top:${layout.columnTop[activeIdx]}px;
            width:${layout.columnWidth}px;
            height:${layout.columnHeight}px;
            box-shadow:inset 0 0 0 3px rgba(59,130,246,0.6);
            pointer-events:none;
            box-sizing:border-box;
          `;
          overlay.appendChild(border);
        }
      }
    }
  }, [boardState, showActiveHighlight, liveStroke]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => redraw());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [redraw]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#1c1c1e" }}
    >
      <canvas ref={bgCanvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
      <canvas ref={strokeCanvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
      <div
        ref={overlayRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
    </div>
  );
};
