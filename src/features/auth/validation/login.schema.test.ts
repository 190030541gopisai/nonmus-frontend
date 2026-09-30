import { describe, expect, it } from "vitest";
import { LoginSchema } from "./login.schema";

describe("LoginSchema", () => {
  it("accepts valid email and password", () => {
    expect(
      LoginSchema.parse({
        credential: "user@example.com",
        password: "secret",
      }),
    ).toEqual({
      credential: "user@example.com",
      password: "secret",
    });
  });

  it("accepts a username as credential", () => {
    expect(
      LoginSchema.parse({ credential: "user123", password: "secret" }),
    ).toEqual({ credential: "user123", password: "secret" });
  });

  it("rejects empty credential", () => {
    const result = LoginSchema.safeParse({ credential: "", password: "secret" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Email / Username is required");
    }
  });

  it("rejects empty password", () => {
    const result = LoginSchema.safeParse({ credential: "user", password: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });

  it("rejects credential longer than 255 characters", () => {
    const result = LoginSchema.safeParse({
      credential: "a".repeat(256),
      password: "secret",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Email / Username cannot exceed 255 characters",
      );
    }
  });

  it("rejects missing fields", () => {
    const result = LoginSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2);
    }
  });
});
