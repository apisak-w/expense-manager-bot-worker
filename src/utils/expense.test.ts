import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseRecordMessage } from "./expense";

describe("expenseUtils", () => {
  describe("parseRecordMessage", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-15"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should parse a valid expense with explicit category", () => {
      const text = "/expense 100 lunch Food";
      const result = parseRecordMessage(text, true);
      expect(result).toEqual({
        date: "2024-02-15",
        category: "Food",
        description: "lunch",
        amount: 100,
        uncleared: false,
      });
    });

    it("should parse an expense with auto-category", () => {
      const text = "/expense 50 taxi";
      const result = parseRecordMessage(text, true);
      expect(result).toEqual({
        date: "2024-02-15",
        category: "Transport",
        description: "taxi",
        amount: 50,
        uncleared: false,
      });
    });

    it("should parse an expense with multiple words in description", () => {
      const text = "/expense 1200 grocery shopping from supermarket Shopping";
      const result = parseRecordMessage(text, true);
      expect(result).toEqual({
        date: "2024-02-15",
        category: "Shopping",
        description: "grocery shopping from supermarket",
        amount: 1200,
        uncleared: false,
      });
    });

    it("should return null for invalid amount", () => {
      const text = "/expense abc lunch";
      const result = parseRecordMessage(text, true);
      expect(result).toBeNull();
    });

    it("should parse a valid income", () => {
      const text = "/income 5000 salary";
      const result = parseRecordMessage(text, false);
      expect(result).toEqual({
        date: "2024-02-15",
        category: "Income",
        description: "salary",
        amount: 5000,
        uncleared: false,
      });
    });

    it("should return null for empty message", () => {
      const result = parseRecordMessage("/expense", true);
      expect(result).toBeNull();
    });
  });
});
