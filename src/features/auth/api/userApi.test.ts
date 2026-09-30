import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/server";
import { checkUsernameAvailability } from "./userApi";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"];

describe("User API", () => {
  describe("Check Username Availability", () => {
    it("returns availability for a username", async () => {
      const username = "testuser";
      const responseData = {
        username,
        available: true,
      };

      server.use(
        http.get(`${BASE_URL}/v1/users/username/available`, ({ request }) => {
          const url = new URL(request.url);

          expect(url.searchParams.get("username")).toBe(username);

          return HttpResponse.json(responseData);
        }),
      );

      const result = await checkUsernameAvailability(username);

      expect(result).toEqual(responseData);
    });

    it("encodes special characters in the username query", async () => {
      const username = "test user/test";
      const responseData = {
        username,
        available: false,
      };

      server.use(
        http.get(`${BASE_URL}/v1/users/username/available`, ({ request }) => {
          const url = new URL(request.url);

          expect(url.searchParams.get("username")).toBe(username);

          return HttpResponse.json(responseData);
        }),
      );

      const result = await checkUsernameAvailability(username);

      expect(result).toEqual(responseData);
    });
  });
});
