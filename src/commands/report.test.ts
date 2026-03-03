import { describe, it, expect, vi } from "vitest";
import { handleReport } from "./report";
import { BotContext } from "../context";
import { SheetsClient } from "../clients/sheets";

describe("report command", () => {
  const mockSheetsClient = {
    getValues: vi.fn(),
  } as unknown as SheetsClient;

  const mockContext = {
    sheetsClient: mockSheetsClient,
    reply: vi.fn().mockResolvedValue({ ok: true, result: { message_id: 999 } }),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
  } as unknown as BotContext;

  describe("handleReport", () => {
    it("should handle report without arguments (current month)", async () => {
      mockSheetsClient.getValues = vi
        .fn()
        .mockResolvedValue([
          ["Title"],
          ["Year", "Month", "Food", "Grand Total"],
          [
            new Date().getFullYear().toString(),
            new Date().toLocaleString("en-US", { month: "short" }),
            "100",
            "100",
          ],
        ]);

      await handleReport(mockContext, "/report");

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining("Fetching report for current month...")
      );
      expect(mockSheetsClient.getValues).toHaveBeenCalledWith(
        "'(Pivot) Annual Report'!A:K"
      );
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining("Report:"),
        expect.objectContaining({ parseMode: "MarkdownV2" })
      );
    });

    it("should handle report with specific month-year", async () => {
      mockSheetsClient.getValues = vi
        .fn()
        .mockResolvedValue([
          ["Title"],
          ["Year", "Month", "Food", "Grand Total"],
          ["2024", "Jan", "50", "50"],
        ]);

      await handleReport(mockContext, "/report 01-2024");

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining("Fetching report for Jan 2024...")
      );
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining("Report: Jan 2024"),
        expect.any(Object)
      );
    });

    it("should handle no data found", async () => {
      mockSheetsClient.getValues = vi
        .fn()
        .mockResolvedValue([["Title"], ["Year", "Month", "Food", "Grand Total"]]);

      await handleReport(mockContext, "/report 12-1999");

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining("No records found for Dec 1999.")
      );
    });

    it("should handle error during report generation", async () => {
      mockSheetsClient.getValues = vi.fn().mockRejectedValue(new Error("Sheets error"));

      await handleReport(mockContext, "/report");

      expect(mockContext.reply).toHaveBeenCalledWith(
        "Sorry, failed to fetch the report."
      );
    });
  });
});
