import { BotContext } from "../context";
import { escapeMarkdownV2 } from "../clients/telegram";
import { getPivotReportData } from "../utils/reportUtils";

const CATEGORY_EMOJIS: Record<string, string> = {
  Shopping: "🛍️",
  Food: "🍴",
  Transport: "🚗",
  Utilities: "💡",
  Entertainment: "🎭",
  Personal: "👤",
  "Housing/Car": "🏠",
  Other: "📦",
  Income: "💰",
};

/**
 * Parse an optional mm-yyyy argument from the /report command text.
 * Returns { month, year } in e.g. "Feb", "2026" format, or undefined if not provided / invalid.
 */
function parseReportArgs(
  text: string
): { month: string; year: string } | undefined {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return undefined;

  const match = parts[1].match(/^(\d{1,2})-(\d{4})$/);
  if (!match) return undefined;

  const mInt = parseInt(match[1], 10);
  if (mInt < 1 || mInt > 12) return undefined;

  const month = new Date(2000, mInt - 1, 1).toLocaleString("en-US", {
    month: "short",
  }); // "Jan", "Feb", …
  const year = match[2];
  return { month, year };
}

export async function handleReport(ctx: BotContext, text: string): Promise<void> {
  console.log(`Handling /report command with text: ${text}`);

  const parsed = parseReportArgs(text);
  const targetMonth = parsed?.month;
  const targetYear = parsed?.year;
  const periodLabel = parsed ? `${parsed.month} ${parsed.year}` : "current month";

  // Send a loading message and capture its message_id so we can delete it later
  const loadingRes = await ctx.reply(
    `Fetching report for ${periodLabel}... please wait.`
  );
  const loadingId = loadingRes.result?.message_id;

  try {
    const rangeName = "'(Pivot) Annual Report'!A:K";
    const values = await ctx.sheetsClient.getValues(rangeName);

    const data = getPivotReportData(values, targetMonth, targetYear);
    if (!data) {
      if (loadingId !== undefined) await ctx.deleteMessage(loadingId);
      await ctx.reply(`No records found for ${periodLabel}.`);
      return;
    }

    // Build MarkdownV2 block-quoted report with spoiler masking
    const title = `📅 Report: ${data.month} ${data.year}`;
    let report = `>*${escapeMarkdownV2(title)}*\n>\n`;

    if (Object.keys(data.summary).length > 0) {
      report += `>*${escapeMarkdownV2("Expenses by Category:")}*\n`;

      const sorted = Object.entries(data.summary).sort(([, a], [, b]) => b - a);
      for (const [cat, amt] of sorted) {
        const emoji = CATEGORY_EMOJIS[cat] ?? "📦";
        const maskedAmt = `||${escapeMarkdownV2(`฿${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` )}||`;
        report += `>${emoji} ${escapeMarkdownV2(cat)}: ${maskedAmt}\n`;
      }
    }

    const maskedTotal = `||${escapeMarkdownV2(`฿${data.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` )}||`;
    report += `>\n>💰 *${escapeMarkdownV2("Total Monthly Expense:")}* ${maskedTotal}`;

    if (loadingId !== undefined) await ctx.deleteMessage(loadingId);

    await ctx.reply(report, { parseMode: "MarkdownV2", protectContent: true });
  } catch (err) {
    console.error("Error in handleReport:", err);
    if (loadingId !== undefined) await ctx.deleteMessage(loadingId);
    await ctx.reply("Sorry, failed to fetch the report.");
  }
}
