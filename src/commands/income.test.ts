import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleIncome } from "./income";
import { BotContext } from "../context";
import { SheetsClient } from "../clients/sheets";

describe("income command", () => {
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

  it("should record a valid income", async () => {
    const text = "/income 5000 salary";
    await handleIncome(mockContext, text);

    expect(mockSheetsClient.appendRow).toHaveBeenCalledWith([
      "2024-02-15",
      "Income",
      "salary",
      5000,
      false,
    ]);
    expect(mockContext.reply).toHaveBeenCalledWith(
      expect.stringContaining("Recorded income: ฿5000 for salary")
    );
  });

  it("should handle invalid format", async () => {
    const text = "/income invalid";
    await handleIncome(mockContext, text);

    expect(mockSheetsClient.appendRow).not.toHaveBeenCalled();
    expect(mockContext.reply).toHaveBeenCalledWith(
      expect.stringContaining("Invalid format")
    );
  });
});
