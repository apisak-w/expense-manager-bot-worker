import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Telegram Handler", () => {
  it("should return 404 for non-POST requests to root", async () => {
    const response = await SELF.fetch("http://example.com", { method: "GET" });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("404 Not Found");
  });

  it("should return 200 for valid POST request (even if empty body)", async () => {
    const response = await SELF.fetch("http://example.com", {
      method: "POST",
      body: JSON.stringify({
        message: { text: "/start", chat: { id: 1 }, from: { id: 123 } },
      }),
      headers: { "Content-Type": "application/json" },
    });

    // In this environment, it should return 200 (webhook OK)
    // even if it logs missing env vars.
    expect(response.status).toBe(200);
  });
});
