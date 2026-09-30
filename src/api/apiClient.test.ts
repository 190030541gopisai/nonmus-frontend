import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import apiClient from "./apiClient";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"];

const responseData = {
  id: "9f70718a-2225-48fa-985c-b34bbe1eabbc",
  username: "test-user",
  email: "test-user@example.com",
  firstName: "test user",
  lastName: "",
  avatar: null,
  createdAt: "2026-09-22T13:09:22.042380Z",
};

describe("Axios response interceptor", () => {
  it("returns the response when the request succeeds", async () => {
    server.use(
      http.get(`${BASE_URL}/v1/auth/me`, () => HttpResponse.json(responseData)),
    );

    const response = await apiClient.get("/v1/auth/me");

    expect(response.status).toBe(200);
    expect(response.data).toEqual(responseData);
  });

  it("refreshes the token and retries the original request after 401", async () => {
    let requestCount = 0;
    let refreshCount = 0;

    server.use(
      http.get(`${BASE_URL}/v1/auth/me`, () => {
        requestCount++;

        if (requestCount === 1) {
          return HttpResponse.json(null, { status: 401 });
        }

        return HttpResponse.json(responseData);
      }),

      http.get(`${BASE_URL}/v1/auth/refresh`, () => {
        refreshCount++;
        return HttpResponse.json(null, { status: 200 });
      }),
    );

    const response = await apiClient.get("/v1/auth/me");

    expect(requestCount).toBe(2);
    expect(refreshCount).toBe(1);
    expect(response.status).toBe(200);
    expect(response.data).toEqual(responseData);
  });

  it("rejects the original request when refresh fails", async () => {
    let refreshCount = 0;

    server.use(
      http.get(`${BASE_URL}/v1/auth/me`, () =>
        HttpResponse.json(null, { status: 401 }),
      ),

      http.get(`${BASE_URL}/v1/auth/refresh`, () => {
        refreshCount++;

        return HttpResponse.json(null, { status: 401 });
      }),
    );

    await expect(apiClient.get("/v1/auth/me")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(refreshCount).toBe(1);
  });
});
