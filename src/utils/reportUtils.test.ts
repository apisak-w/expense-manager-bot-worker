import { describe, it, expect } from "vitest";
import { getPivotReportData } from "./reportUtils";

describe("reportUtils", () => {
  describe("getPivotReportData", () => {
    const mockValues = [
      ["Title"],
      ["Year", "Month", "Food", "Shopping", "Grand Total"],
      ["2024", "Jan", "100", "50", "150"],
      ["", "Feb", "200", "100", "300"],
    ];

    it("should extract report data for the current month/year if not specified", () => {
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const currentMonth = now.toLocaleString("en-US", { month: "short" });

      const data = [
        ["Title"],
        ["Year", "Month", "Food", "Grand Total"],
        [currentYear, currentMonth, "123", "123"],
      ];

      const result = getPivotReportData(data);
      expect(result).not.toBeNull();
      expect(result?.year).toBe(currentYear);
      expect(result?.month).toBe(currentMonth);
      expect(result?.summary).toEqual({ Food: 123 });
      expect(result?.total).toBe(123);
    });

    it("should extract report data for a specific month and year", () => {
      const result = getPivotReportData(mockValues, "Feb", "2024");
      expect(result).not.toBeNull();
      expect(result?.year).toBe("2024");
      expect(result?.month).toBe("Feb");
      expect(result?.summary).toEqual({ Food: 200, Shopping: 100 });
      expect(result?.total).toBe(300);
    });

    it("should handle merged year cells correctly", () => {
      const result = getPivotReportData(mockValues, "Feb", "2024");
      expect(result).not.toBeNull();
      expect(result?.month).toBe("Feb");
      expect(result?.year).toBe("2024");
    });

    it("should return null if month/year not found", () => {
      const result = getPivotReportData(mockValues, "Mar", "2024");
      expect(result).toBeNull();
    });

    it("should return null if input values are too short", () => {
      const result = getPivotReportData([["Title"], ["Year", "Month"]]);
      expect(result).toBeNull();
    });
  });
});
