import { describe, expect, it } from "vitest";
import { formatSeconds } from "./TimeUtils";

describe("formatSeconds", () => {
  it("formats seconds below one minute", () => {
    expect(formatSeconds(0)).toBe("0s");
    expect(formatSeconds(9)).toBe("9s");
    expect(formatSeconds(59)).toBe("59s");
  });

  it("formats minutes and remaining seconds", () => {
    expect(formatSeconds(60)).toBe("1m 0s");
    expect(formatSeconds(61)).toBe("1m 1s");
    expect(formatSeconds(125)).toBe("2m 5s");
  });

  it("formats values over one hour without hour units", () => {
    expect(formatSeconds(3600)).toBe("60m 0s");
  });
});
