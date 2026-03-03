export interface PivotReportData {
  month: string;
  year: string;
  summary: Record<string, number>;
  total: number;
}

/**
 * Extract structured data from pivot table values.
 * The pivot sheet has:
 *   Row 0: title row (ignored)
 *   Row 1: headers — [Year, Month, Cat1, Cat2, ..., Grand Total]
 *   Row 2+: data — year may be empty (merged cell), month per row
 *
 * Port of get_pivot_report_data in utils.py.
 */
export function getPivotReportData(
  values: unknown[][],
  targetMonth?: string,
  targetYear?: string
): PivotReportData | null {
  if (!values || values.length < 3) return null;

  const headers = values[1] as string[];
  // Categories are from index 2 to second-to-last (before Grand Total)
  const categories = headers.slice(2, -1);

  const now = new Date();
  const resolvedYear = targetYear ?? now.getFullYear().toString();
  const resolvedMonth = targetMonth ?? now.toLocaleString("en-US", { month: "short" }); // e.g. "Feb"

  let currentYear = "";
  let targetRow: unknown[] | null = null;

  for (const row of values.slice(2)) {
    const typedRow = row as unknown[];
    const yearCell = String(typedRow[0] ?? "").trim();

    // Merged year cell — only present when year changes
    if (yearCell && !yearCell.includes("Total")) {
      currentYear = yearCell;
    }

    const monthCell = String(typedRow[1] ?? "").trim();
    if (currentYear === resolvedYear && monthCell === resolvedMonth) {
      targetRow = typedRow;
      break;
    }
  }

  if (!targetRow) return null;

  const summary: Record<string, number> = {};
  let totalExpense = 0;

  for (let i = 0; i < categories.length; i++) {
    const valIdx = i + 2;
    if (valIdx < targetRow.length) {
      const raw = targetRow[valIdx];
      const amount = raw !== "" ? parseFloat(String(raw)) : 0;
      if (!isNaN(amount) && amount > 0) {
        summary[categories[i]] = amount;
        totalExpense += amount;
      }
    }
  }

  // Grand Total is the last column
  let grandTotal = totalExpense;
  const lastIdx = headers.length - 1;
  if (lastIdx < targetRow.length) {
    const rawTotal = parseFloat(String(targetRow[lastIdx]));
    if (!isNaN(rawTotal)) grandTotal = rawTotal;
  }

  return {
    month: resolvedMonth,
    year: resolvedYear,
    summary,
    total: grandTotal,
  };
}
