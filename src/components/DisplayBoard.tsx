import React, { useCallback, useEffect, useRef } from "react";
import { BoardState } from "../board/boardTypes";
import { setupCanvasDpi } from "../canvas/setupCanvasDpi";
import { renderSingleStroke } from "../canvas/strokeRenderUtils";
import { calculateDisplayColumnLayout } from "../geometry/columnLayout";

interface Props {
  boardState: BoardState;
  showActiveHighlight?: boolean;
}

export const DisplayBoard: React.FC<Props> = ({ boardState, showActiveHighlight = true }) => {
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
    bgCtx.fillStyle = "#1a1a1a";
    bgCtx.fillRect(0, 0, rect.width, rect.height);

    columns.forEach((_, i) => {
      bgCtx.fillStyle = "#ffffff";
      bgCtx.fillRect(layout.columnLeft[i], layout.columnTop[i], layout.columnWidth, layout.columnHeight);

      bgCtx.strokeStyle = "#e8e8e8";
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
    });

    // Strokes
    const strokeCtx = setupCanvasDpi(strokeCanvas);
    strokeCtx.clearRect(0, 0, rect.width, rect.height);

    columns.forEach((col, i) => {
      for (const stroke of col.strokes) {
        renderSingleStroke(strokeCtx, stroke, layout.scale, layout.columnLeft[i], layout.columnTop[i]);
      }
    });
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
            left:${layout.columnLeft[activeIdx] - 3}px;
            top:${layout.columnTop[activeIdx] - 3}px;
            width:${layout.columnWidth + 6}px;
            height:${layout.columnHeight + 6}px;
            border:3px solid #3b82f6;
            border-radius:4px;
            pointer-events:none;
            box-sizing:border-box;
          `;
          overlay.appendChild(border);

          const label = document.createElement("div");
          label.textContent = `Col ${activeIdx + 1}`;
          label.style.cssText = `
            position:absolute;
            left:${layout.columnLeft[activeIdx]}px;
            top:${layout.columnTop[activeIdx] - 22}px;
            color:#3b82f6;
            font-size:12px;
            font-family:monospace;
            pointer-events:none;
          `;
          overlay.appendChild(label);
        }
      }
    }
  }, [boardState, showActiveHighlight]);

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
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#1a1a1a" }}
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
