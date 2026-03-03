import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleExpense } from "./expense";
import { BotContext } from "../context";
import { SheetsClient } from "../clients/sheets";

describe("expense command", () => {
  const mockSheetsClient = {
    appendRow: vi.fn().mockResolvedValue(undefined),
  } as unknown as SheetsClient;

  const mockContext = {
    sheetsClient: mockSheetsClient,
    reply: vi.fn().mockResolvedValue({ ok: true }),
  } as unknown as BotContext;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-15"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should record a valid expense", async () => {
    const text = "/expense 100 lunch Food";
    await handleExpense(mockContext, text);

    expect(mockSheetsClient.appendRow).toHaveBeenCalledWith([
      "2024-02-15",
      "Food",
      "lunch",
      100,
      false,
    ]);
    expect(mockContext.reply).toHaveBeenCalledWith(
      expect.stringContaining("Recorded expense: ฿100 for lunch")
    );
  });

  it("should handle invalid format", async () => {
    const text = "/expense invalid";
    await handleExpense(mockContext, text);

    expect(mockSheetsClient.appendRow).not.toHaveBeenCalled();
    expect(mockContext.reply).toHaveBeenCalledWith(
      expect.stringContaining("Invalid format")
    );
  });
});
