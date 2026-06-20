import { InputMode } from "../board/boardTypes";

export function shouldAcceptPointer(
  e: PointerEvent,
  mode: InputMode,
  hasDetectedPen: boolean
): boolean {
  if (mode === "penOnly") {
    return e.pointerType === "pen";
  }
  if (mode === "touchMouse") {
    return e.pointerType !== "pen";
  }
  // auto mode: reject touch after pen has been detected
  if (hasDetectedPen && e.pointerType === "touch") {
    return false;
  }
  return true;
}

export class InputManager {
  private activePointerId: number | null = null;
  private hasDetectedPen = false;
  private mode: InputMode = "auto";

  setMode(mode: InputMode) {
    this.mode = mode;
  }

  getMode(): InputMode {
    return this.mode;
  }

  hasSeenPen(): boolean {
    return this.hasDetectedPen;
  }

  getActivePointerId(): number | null {
    return this.activePointerId;
  }

  tryAcquire(e: PointerEvent): boolean {
    if (e.pointerType === "pen") {
      this.hasDetectedPen = true;
    }
    if (!shouldAcceptPointer(e, this.mode, this.hasDetectedPen)) {
      return false;
    }
    if (this.activePointerId !== null) {
      return false; // already drawing with another pointer
    }
    this.activePointerId = e.pointerId;
    return true;
  }

  isActive(e: PointerEvent): boolean {
    return this.activePointerId === e.pointerId;
  }

  release() {
    this.activePointerId = null;
  }
}
