import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useSignUpMultiStepForm from "./useSignUpMultiStepForm";

type Step = {
  id: string;
  next: string | null;
  previous: string | null;
};

const steps: Step[] = [
  { id: "first", next: "second", previous: null },
  { id: "second", next: "third", previous: "first" },
  { id: "third", next: null, previous: "second" },
];

describe("useSignUpMultiStepForm", () => {
  it("starts at the first step", () => {
    const { result } = renderHook(() => useSignUpMultiStepForm(steps));

    expect(result.current.currentStep).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it("moves to next and previous steps", () => {
    const { result } = renderHook(() => useSignUpMultiStepForm(steps));

    act(() => result.current.goToNextStep());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);

    act(() => result.current.goToPreviousStep());
    expect(result.current.currentStep).toBe(0);
  });

  it("does not move before first step", () => {
    const { result } = renderHook(() => useSignUpMultiStepForm(steps));

    act(() => result.current.goToPreviousStep());

    expect(result.current.currentStep).toBe(0);
  });

  it("does not move after last step", () => {
    const { result } = renderHook(() => useSignUpMultiStepForm(steps));

    act(() => result.current.goToStep("third"));
    expect(result.current.isLastStep).toBe(true);

    act(() => result.current.goToNextStep());

    expect(result.current.currentStep).toBe(2);
  });

  it("moves directly to a step by id", () => {
    const { result } = renderHook(() => useSignUpMultiStepForm(steps));

    act(() => result.current.goToStep("third"));

    expect(result.current.currentStep).toBe(2);
    expect(result.current.isLastStep).toBe(true);
  });

  it("ignores unknown step ids", () => {
    const { result } = renderHook(() => useSignUpMultiStepForm(steps));

    act(() => result.current.goToStep("missing"));

    expect(result.current.currentStep).toBe(0);
  });

  it("ignores missing next and previous links", () => {
    const stepsWithMissingLinks: Step[] = [
      { id: "first", next: "missing", previous: null },
      { id: "second", next: null, previous: "missing" },
    ];
    const { result } = renderHook(() =>
      useSignUpMultiStepForm(stepsWithMissingLinks),
    );

    act(() => result.current.goToNextStep());
    expect(result.current.currentStep).toBe(0);

    act(() => result.current.goToStep("second"));
    act(() => result.current.goToPreviousStep());
    expect(result.current.currentStep).toBe(1);
  });
});
