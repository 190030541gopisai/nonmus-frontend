import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useCooldown from "./useCooldown";

describe("useCooldown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at zero when initial seconds are null", () => {
    const { result } = renderHook(() => useCooldown(null));

    expect(result.current.remaining).toBe(0);
  });

  it("starts at the provided number of seconds", () => {
    const { result } = renderHook(() => useCooldown(5));

    expect(result.current.remaining).toBe(5);
  });

  it("counts down once per second", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown(2));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(0);
  });

  it("does not create a countdown when remaining is zero", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown(0));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remaining).toBe(0);
  });

  it("resets remaining seconds", () => {
    const { result } = renderHook(() => useCooldown(5));

    act(() => {
      result.current.reset(12);
    });

    expect(result.current.remaining).toBe(12);
  });

  it("updates when initial seconds prop changes", () => {
    const { result, rerender } = renderHook(
      ({ seconds }: { seconds: number | null }) => useCooldown(seconds),
      { initialProps: { seconds: 5 } },
    );

    rerender({ seconds: 9 });

    expect(result.current.remaining).toBe(9);
  });

  it("does not reset from null prop", () => {
    const { result, rerender } = renderHook(
      ({ seconds }: { seconds: number | null }) => useCooldown(seconds),
      { initialProps: { seconds: 5 as number | null } },
    );

    rerender({ seconds: null });

    expect(result.current.remaining).toBe(5);
  });
});
