import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BoardState,
  InputMode,
  Point,
  Stroke,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from "../board/boardTypes";
import { setupCanvasDpi } from "../canvas/setupCanvasDpi";
import { drawBackground } from "../canvas/backgroundRenderUtils";
import { renderStrokesOnCanvas, appendStrokeSegment } from "../canvas/strokeRenderUtils";
import { calculateTeacherCanvasLayout } from "../geometry/columnLayout";
import { strokeHitsPoint } from "../geometry/strokeHitTest";
import { InputManager } from "../input/InputManager";
import type { EraserMode } from "./penConstants";

export type { EraserMode };

export interface TeacherDebugInfo {
  pointerType: string;
  pressure: number;
  activePointerId: number | null;
  inputMode: InputMode;
  detectedPen: boolean;
  logicalX: number;
  logicalY: number;
  devicePixelRatio: number;
  canvasCssWidth: number;
  canvasCssHeight: number;
  canvasBackingWidth: number;
  canvasBackingHeight: number;
  scale: number;
  pointCount: number;
}

interface Props {
  boardState: BoardState;
  onStrokeCommitted: (stroke: Stroke) => void;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  currentTool: "pen" | "eraser";
  onToolChange?: (tool: "pen" | "eraser") => void;
  currentColor: string;
  currentWidth: number;
  currentEraserWidth: number;
  eraserMode?: EraserMode;
  onStrokesErased?: (columnId: string, strokeIds: string[]) => void;
  showDebug?: boolean;
  onDebugInfo?: (info: TeacherDebugInfo) => void;
}

const MIN_LOGICAL_DISTANCE = 2.0;

export const TeacherCanvas: React.FC<Props> = ({
  boardState,
  onStrokeCommitted,
  inputMode,
  currentTool,
  onToolChange,
  currentColor,
  currentWidth,
  currentEraserWidth,
  eraserMode = "area",
  onStrokesErased,
  onDebugInfo,
}) => {
  // Track if barrel button auto-switched to eraser so we can restore
  const barrelEraserActive = useRef(false);
  // Stroke-eraser gesture state
  const strokeErasingRef = useRef(false);
  const erasedIdsRef = useRef<Set<string>>(new Set());
  const activeStrokesRef = useRef<Stroke[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const strokeCanvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef({ canvasWidth: 0, canvasHeight: 0, offsetX: 0, offsetY: 0, scale: 1 });
  const inputManagerRef = useRef(new InputManager());
  const activeStrokeRef = useRef<Stroke | null>(null);
  const strokeCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    inputManagerRef.current.setMode(inputMode);
  }, [inputMode]);

  // Detect S Pen barrel button during HOVER (before tip touches screen).
  // Chrome Android intercepts barrel+touch as right-click at OS level, so we
  // pre-switch to eraser while hovering (pressure===0, buttons===2).
  const onToolChangeRef = useRef(onToolChange);
  onToolChangeRef.current = onToolChange;
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onHover = (e: PointerEvent) => {
      if (e.pointerType !== "pen") return;
      const barrelHeld = (e.buttons & 2) !== 0;
      if (barrelHeld && !barrelEraserActive.current) {
        barrelEraserActive.current = true;
        onToolChangeRef.current?.("eraser");
      } else if (!barrelHeld && barrelEraserActive.current && e.pressure === 0) {
        // Barrel released while still hovering (pen not touching)
        barrelEraserActive.current = false;
        onToolChangeRef.current?.("pen");
      }
    };

    // Prevent context menu globally while this canvas is mounted — barrel button
    // triggers contextmenu on Android Chrome before pointer events arrive.
    const preventCtx = (e: Event) => e.preventDefault();

    el.addEventListener("pointermove", onHover);
    el.addEventListener("pointerover", onHover);
    el.addEventListener("contextmenu", preventCtx);
    return () => {
      el.removeEventListener("pointermove", onHover);
      el.removeEventListener("pointerover", onHover);
      el.removeEventListener("contextmenu", preventCtx);
    };
  }, []);

  const activeColumnIndex = boardState.columns.findIndex(
    (c) => c.id === boardState.activeColumnId
  );
  const activeColumn = boardState.columns[activeColumnIndex];
  activeStrokesRef.current = activeColumn?.strokes ?? [];

  const eraseAt = useCallback(
    (lx: number, ly: number) => {
      if (!onStrokesErased) return;
      const radius = currentEraserWidth / 2;
      const hits: string[] = [];
      for (const s of activeStrokesRef.current) {
        if (erasedIdsRef.current.has(s.id)) continue;
        if (strokeHitsPoint(s, lx, ly, radius)) {
          erasedIdsRef.current.add(s.id);
          hits.push(s.id);
        }
      }
      if (hits.length > 0) {
        onStrokesErased(boardState.activeColumnId, hits);
      }
    },
    [currentEraserWidth, onStrokesErased, boardState.activeColumnId]
  );

  const applyLayout = useCallback((layout: ReturnType<typeof calculateTeacherCanvasLayout>) => {
    [bgCanvasRef.current, strokeCanvasRef.current].forEach((c) => {
      if (!c) return;
      c.style.position = "absolute";
      c.style.left = `${layout.offsetX}px`;
      c.style.top = `${layout.offsetY}px`;
      c.style.width = `${layout.canvasWidth}px`;
      c.style.height = `${layout.canvasHeight}px`;
    });
  }, []);

  const redrawAll = useCallback(() => {
    if (!bgCanvasRef.current || !strokeCanvasRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const layout = calculateTeacherCanvasLayout(rect.width, rect.height);
    layoutRef.current = layout;
    applyLayout(layout);

    drawBackground(bgCanvasRef.current, { showGrid: true });

    const strokes = activeColumn?.strokes ?? [];
    renderStrokesOnCanvas(strokeCanvasRef.current, strokes, layout.scale, 0, 0);

    const ctx = strokeCanvasRef.current.getContext("2d");
    if (ctx) strokeCtxRef.current = ctx;
  }, [activeColumn, applyLayout]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      redrawAll();
      forceUpdate((n) => n + 1);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [redrawAll]);

  const toLogical = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const layout = layoutRef.current;
      const containerRect = containerRef.current!.getBoundingClientRect();
      const relX = clientX - containerRect.left - layout.offsetX;
      const relY = clientY - containerRect.top - layout.offsetY;
      return {
        x: Math.max(0, Math.min(LOGICAL_WIDTH, (relX / layout.canvasWidth) * LOGICAL_WIDTH)),
        y: Math.max(0, Math.min(LOGICAL_HEIGHT, (relY / layout.canvasHeight) * LOGICAL_HEIGHT)),
      };
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const canvas = strokeCanvasRef.current;
      if (!canvas) return;
      const im = inputManagerRef.current;
      if (!im.tryAcquire(e.nativeEvent)) return;

      canvas.setPointerCapture(e.pointerId);

      // S Pen side (barrel) button = secondary button (buttons & 2).
      // Eraser end of the pen flipped over = buttons & 32. Both → erase.
      const penEraseButton =
        e.pointerType === "pen" && ((e.buttons & 2) !== 0 || (e.buttons & 32) !== 0);
      if (penEraseButton && currentTool !== "eraser" && onToolChange) {
        barrelEraserActive.current = true;
        onToolChange("eraser");
      }

      const logical = toLogical(e.clientX, e.clientY);
      const point: Point = { x: logical.x, y: logical.y, pressure: e.pressure, timestamp: Date.now() };

      const effectiveTool = penEraseButton ? "eraser" : currentTool;

      // Stroke-eraser: remove whole strokes on contact instead of drawing.
      if (effectiveTool === "eraser" && eraserMode === "stroke") {
        strokeErasingRef.current = true;
        erasedIdsRef.current = new Set();
        activeStrokeRef.current = null;
        eraseAt(logical.x, logical.y);
        return;
      }

      const effectiveWidth = effectiveTool === "eraser" ? currentEraserWidth : currentWidth;
      activeStrokeRef.current = {
        id: crypto.randomUUID(),
        columnId: boardState.activeColumnId,
        tool: effectiveTool,
        color: currentColor,
        width: effectiveWidth,
        points: [point],
      };

      const layout = layoutRef.current;
      onDebugInfo?.({
        pointerType: e.pointerType,
        pressure: e.pressure,
        activePointerId: im.getActivePointerId(),
        inputMode: im.getMode(),
        detectedPen: im.hasSeenPen(),
        logicalX: logical.x,
        logicalY: logical.y,
        devicePixelRatio: window.devicePixelRatio,
        canvasCssWidth: layout.canvasWidth,
        canvasCssHeight: layout.canvasHeight,
        canvasBackingWidth: canvas.width,
        canvasBackingHeight: canvas.height,
        scale: layout.scale,
        pointCount: 1,
      });
    },
    [boardState.activeColumnId, currentTool, onToolChange, currentColor, currentWidth, currentEraserWidth, eraserMode, eraseAt, onDebugInfo, toLogical]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const im = inputManagerRef.current;
      if (!im.isActive(e.nativeEvent)) return;

      // Stroke-eraser gesture: hit-test each point, no drawing.
      if (strokeErasingRef.current) {
        const moveEvents = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
        for (const ev of moveEvents) {
          const logical = toLogical(ev.clientX, ev.clientY);
          eraseAt(logical.x, logical.y);
        }
        return;
      }

      const stroke = activeStrokeRef.current;
      if (!stroke) return;

      const events = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
      let lastLogical: { x: number; y: number } | null = null;

      for (const ev of events) {
        const logical = toLogical(ev.clientX, ev.clientY);
        const last = stroke.points[stroke.points.length - 1];
        const dx = logical.x - last.x;
        const dy = logical.y - last.y;
        if (Math.sqrt(dx * dx + dy * dy) < MIN_LOGICAL_DISTANCE) continue;

        const point: Point = { x: logical.x, y: logical.y, pressure: ev.pressure, timestamp: Date.now() };
        stroke.points.push(point);
        lastLogical = logical;

        if (strokeCtxRef.current) {
          const layout = layoutRef.current;
          appendStrokeSegment(strokeCtxRef.current, stroke, layout.scale, 0, 0, stroke.points.length - 1);
        }
      }

      if (lastLogical) {
        const layout = layoutRef.current;
        const canvas = strokeCanvasRef.current;
        onDebugInfo?.({
          pointerType: e.pointerType,
          pressure: e.pressure,
          activePointerId: im.getActivePointerId(),
          inputMode: im.getMode(),
          detectedPen: im.hasSeenPen(),
          logicalX: lastLogical.x,
          logicalY: lastLogical.y,
          devicePixelRatio: window.devicePixelRatio,
          canvasCssWidth: layout.canvasWidth,
          canvasCssHeight: layout.canvasHeight,
          canvasBackingWidth: canvas?.width ?? 0,
          canvasBackingHeight: canvas?.height ?? 0,
          scale: layout.scale,
          pointCount: stroke.points.length,
        });
      }
    },
    [eraseAt, onDebugInfo, toLogical]
  );

  const commitStroke = useCallback(() => {
    const stroke = activeStrokeRef.current;
    if (stroke && stroke.points.length > 0) {
      onStrokeCommitted(stroke);
    }
    activeStrokeRef.current = null;
    strokeErasingRef.current = false;
    inputManagerRef.current.release();
    // Barrel restore is handled by hover listener (pointerover/pointermove at pressure 0)
  }, [onStrokeCommitted]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inputManagerRef.current.isActive(e.nativeEvent)) return;
      commitStroke();
    },
    [commitStroke]
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inputManagerRef.current.isActive(e.nativeEvent)) return;
      commitStroke();
    },
    [commitStroke]
  );

  const onLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inputManagerRef.current.isActive(e.nativeEvent)) return;
      commitStroke();
    },
    [commitStroke]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#1c1c1e",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={bgCanvasRef} style={{ position: "absolute", touchAction: "none" }} />
      <canvas ref={strokeCanvasRef} style={{ position: "absolute", touchAction: "none" }} />
      {/* Active-column badge. Overlay layer (HTML, not canvas) per layered design. */}
      <div
        style={{
          position: "absolute",
          top: `${layoutRef.current.offsetY + 10}px`,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "4px 12px",
          background: "rgba(28,28,30,0.7)",
          border: "1px solid #3a3a3c",
          borderRadius: "999px",
          color: "#9ca3af",
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.04em",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        COLUMN {activeColumnIndex + 1}
      </div>
    </div>
  );
};
