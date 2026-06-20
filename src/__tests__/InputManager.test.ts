import { describe, it, expect } from "vitest";
import { InputManager, shouldAcceptPointer } from "../input/InputManager";

function makePointerEvent(pointerType: string, pointerId = 1): PointerEvent {
  return { pointerType, pointerId } as unknown as PointerEvent;
}

describe("shouldAcceptPointer", () => {
  it("penOnly: accepts pen", () => {
    expect(shouldAcceptPointer(makePointerEvent("pen"), "penOnly", false)).toBe(true);
  });
  it("penOnly: rejects touch", () => {
    expect(shouldAcceptPointer(makePointerEvent("touch"), "penOnly", false)).toBe(false);
  });
  it("penOnly: rejects mouse", () => {
    expect(shouldAcceptPointer(makePointerEvent("mouse"), "penOnly", false)).toBe(false);
  });
  it("auto: accepts touch before pen detected", () => {
    expect(shouldAcceptPointer(makePointerEvent("touch"), "auto", false)).toBe(true);
  });
  it("auto: rejects touch after pen detected", () => {
    expect(shouldAcceptPointer(makePointerEvent("touch"), "auto", true)).toBe(false);
  });
  it("auto: accepts pen always", () => {
    expect(shouldAcceptPointer(makePointerEvent("pen"), "auto", true)).toBe(true);
  });
  it("touchMouse: rejects pen", () => {
    expect(shouldAcceptPointer(makePointerEvent("pen"), "touchMouse", false)).toBe(false);
  });
  it("touchMouse: accepts touch", () => {
    expect(shouldAcceptPointer(makePointerEvent("touch"), "touchMouse", false)).toBe(true);
  });
  it("touchMouse: accepts mouse", () => {
    expect(shouldAcceptPointer(makePointerEvent("mouse"), "touchMouse", false)).toBe(true);
  });
});

describe("InputManager", () => {
  it("blocks second pointer while first is active", () => {
    const im = new InputManager();
    expect(im.tryAcquire(makePointerEvent("pen", 1))).toBe(true);
    expect(im.tryAcquire(makePointerEvent("pen", 2))).toBe(false);
  });

  it("allows acquire after release", () => {
    const im = new InputManager();
    im.tryAcquire(makePointerEvent("pen", 1));
    im.release();
    expect(im.tryAcquire(makePointerEvent("pen", 1))).toBe(true);
  });

  it("sets hasSeenPen when pen is used", () => {
    const im = new InputManager();
    expect(im.hasSeenPen()).toBe(false);
    im.tryAcquire(makePointerEvent("pen", 1));
    expect(im.hasSeenPen()).toBe(true);
  });

  it("auto: rejects touch after pen has been detected", () => {
    const im = new InputManager();
    im.tryAcquire(makePointerEvent("pen", 1));
    im.release();
    expect(im.tryAcquire(makePointerEvent("touch", 2))).toBe(false);
  });
});
