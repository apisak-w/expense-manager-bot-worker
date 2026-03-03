import { describe, it, expect, vi } from "vitest";
import { handleStart } from "./start";
import { BotContext } from "../context";

describe("start command", () => {
  it("should send a welcome message", async () => {
    const mockContext = {
      reply: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as BotContext;

    await handleStart(mockContext);

    expect(mockContext.reply).toHaveBeenCalledWith(expect.stringContaining("Hi! I'm your Expense Manager Bot."));
    expect(mockContext.reply).toHaveBeenCalledWith(expect.stringContaining("/expense"));
  });
});
