import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("User Handler - Permissions Endpoint", () => {
  it("should return 200 and user permissions for a valid GET request", async () => {
    const response = await SELF.fetch("http://example.com/users/12345/permissions", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { userId: number; isAuthorized: boolean };
    expect(body).toHaveProperty("userId", 12345);
    expect(body).toHaveProperty("isAuthorized");
  });

  it("should return 400 for invalid userId", async () => {
    const response = await SELF.fetch("http://example.com/users/abc/permissions", {
      method: "GET",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid User ID");
  });

  it("should return 404 for unknown routes", async () => {
    const response = await SELF.fetch("http://example.com/unknown", {
      method: "GET",
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("404 Not Found");
  });
});
