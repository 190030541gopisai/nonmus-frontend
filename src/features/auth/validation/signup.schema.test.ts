import { describe, expect, it } from "vitest";
import { SignUpSchema } from "./signup.schema";

const validData = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  verificationCode: "123456",
  username: "ada123",
  password: "Secret1!",
  confirmPassword: "Secret1!",
};

describe("SignUpSchema", () => {
  it("accepts valid signup data", () => {
    expect(SignUpSchema.parse(validData)).toEqual(validData);
  });

  it("accepts an empty optional last name", () => {
    expect(SignUpSchema.parse({ ...validData, lastName: "" }).lastName).toBe("");
  });

  it.each([
    ["firstName", "", "First name is required"],
    ["firstName", "a".repeat(51), "First name cannot exceed 50 characters"],
    ["lastName", "a".repeat(51), "Last name cannot exceed 50 characters"],
    ["email", "not-an-email", "Enter a valid email address"],
    ["email", "a".repeat(256) + "@example.com", "Email cannot exceed 255 characters"],
    ["verificationCode", "12345", "Verification code must be exactly 6 digits"],
    ["verificationCode", "12345a", "Verification code must be exactly 6 digits"],
    ["username", "ab", "Username must be at least 3 characters"],
    ["username", "a".repeat(31), "Username cannot exceed 30 characters"],
    ["password", "short", "Password must be at least 8 characters"],
    ["password", "a".repeat(65), "Password cannot exceed 64 characters"],
    ["password", "Password!", "Password must contain a number"],
    ["password", "Password1", "Password must contain a special character"],
  ])("rejects invalid %s", (field, value, message) => {
    const result = SignUpSchema.safeParse({
      ...validData,
      [field]: value,
      ...(field === "password" ? { confirmPassword: value } : {}),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(message);
    }
  });

  it("rejects mismatched passwords", () => {
    const result = SignUpSchema.safeParse({
      ...validData,
      confirmPassword: "Different1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["confirmPassword"],
          message: "Passwords do not match",
        }),
      );
    }
  });

  it("reports all missing required fields", () => {
    const result = SignUpSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(1);
    }
  });
});
