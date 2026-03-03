import { describe, it, expect, vi, beforeEach } from "vitest";
import { BotContext } from "./context";
import { SheetsClient } from "./clients/sheets";
import { sendTelegramMessage, deleteTelegramMessage } from "./clients/telegram";

vi.mock("./clients/telegram", () => ({
  sendTelegramMessage: vi.fn(),
  deleteTelegramMessage: vi.fn(),
}));

describe("BotContext", () => {
  const mockSheetsClient = {} as SheetsClient;
  const token = "fake-token";
  const chatId = 123456;
  let ctx: BotContext;

  beforeEach(() => {
    ctx = new BotContext(token, chatId, mockSheetsClient);
    vi.clearAllMocks();
  });

  it("should initialize with correct properties", () => {
    expect(ctx.token).toBe(token);
    expect(ctx.chatId).toBe(chatId);
    expect(ctx.sheetsClient).toBe(mockSheetsClient);
  });

  it("should call sendTelegramMessage when reply is called", async () => {
    const text = "Hello world";
    const options = { parseMode: "MarkdownV2" };
    vi.mocked(sendTelegramMessage).mockResolvedValue({ ok: true });

    await ctx.reply(text, options);

    expect(sendTelegramMessage).toHaveBeenCalledWith(token, chatId, text, options);
  });

  it("should call deleteTelegramMessage when deleteMessage is called", async () => {
    const messageId = 987;
    vi.mocked(deleteTelegramMessage).mockResolvedValue(undefined);

    await ctx.deleteMessage(messageId);

    expect(deleteTelegramMessage).toHaveBeenCalledWith(token, chatId, messageId);
  });
});
