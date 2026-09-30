import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/server";
import { sendVerificationCode, verifyCode, signUp, login } from "./authApi";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"];

describe("Auth API", () => {
  describe("Send Verification Code", () => {
    it("sends an email and returns the verification code result", async () => {
      const requestData = {
        email: "test-user@example.com",
      };

      const responseData = {
        codeExpiryInSeconds: 300,
        resendInSeconds: 60,
      };

      server.use(
        http.post(`${BASE_URL}/v1/auth/email`, async ({ request }) => {
          const body = await request.json();

          expect(body).toEqual(requestData);

          return HttpResponse.json(responseData);
        }),
      );

      const result = await sendVerificationCode(requestData.email);

      expect(result).toEqual(responseData);
    });
  });

  describe("Verify Code", () => {
    it("verifies code successful", async () => {
      const email = "test-user@example.com";
      const code = "123456";

      const requestData = {
        email,
        code,
      };

      const responseData = {
        verified: true,
      };

      server.use(
        http.post(`${BASE_URL}/v1/auth/email/verify`, async ({ request }) => {
          const body = await request.json();

          expect(body).toEqual(requestData);

          return HttpResponse.json(responseData);
        }),
      );

      const result = await verifyCode(email, code);
      expect(result).toEqual(responseData);
    });
  });

  describe("Sign up", () => {
    it("signs up and returns the user result", async () => {
      const requestData = {
        firstName: "Test",
        lastName: "User",
        username: "testuser",
        password: "password123",
        confirmPassword: "password123",
      };

      const responseData = {
        message: "Account created",
        username: "testuser",
        email: "test-user@example.com",
        avatar: "",
      };

      server.use(
        http.post(`${BASE_URL}/v1/auth/signup`, async ({ request }) => {
          const body = await request.json();

          expect(body).toEqual(requestData);

          return HttpResponse.json(responseData);
        }),
      );

      const result = await signUp(requestData);

      expect(result).toEqual(responseData);
    });
  });

  describe("Login", () => {
    it("logs in and returns the user result", async () => {
      const requestData = {
        credential: "test-user@example.com",
        password: "password123",
      };

      const responseData = {
        message: "Logged in",
        username: "testuser",
        email: "test-user@example.com",
        avatar: "",
      };

      server.use(
        http.post(`${BASE_URL}/v1/auth/login`, async ({ request }) => {
          const body = await request.json();

          expect(body).toEqual(requestData);

          return HttpResponse.json(responseData);
        }),
      );

      const result = await login(requestData);

      expect(result).toEqual(responseData);
    });
  });
});
