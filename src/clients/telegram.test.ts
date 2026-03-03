import { describe, it, expect, vi } from "vitest";
import { escapeMarkdownV2, sendTelegramMessage } from "./telegram";

describe("telegram client", () => {
  describe("escapeMarkdownV2", () => {
    it("should escape special characters", () => {
      const input = "Hello_World * [test] (link) ~ ` > # + - = | { } . ! \\";
      const expected = "Hello\\_World \\* \\[test\\] \\(link\\) \\~ \\` \\> \\# \\+ \\- \\= \\| \\{ \\} \\. \\! \\\\";
      expect(escapeMarkdownV2(input)).toBe(expected);
    });

    it("should return empty string for empty input", () => {
      expect(escapeMarkdownV2("")).toBe("");
    });
  });

  describe("sendTelegramMessage", () => {
    it("should send a POST request to Telegram API", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 123 } }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const token = "fake-token";
      const chatId = 456;
      const text = "Hello";
      const response = await sendTelegramMessage(token, chatId, text);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${token}/sendMessage`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
            protect_content: false,
          }),
        })
      );
      expect(response.ok).toBe(true);
      expect(response.result?.message_id).toBe(123);
    });

    it("should handle API errors", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => "Error detail",
      });
      vi.stubGlobal("fetch", mockFetch);

      const response = await sendTelegramMessage("token", 1, "text");
      expect(response.ok).toBe(false);
      expect(response.description).toBe("Error detail");
    });
  });
});
