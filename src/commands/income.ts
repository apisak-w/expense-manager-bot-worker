import { BotContext } from "../context";
import { parseRecordMessage } from "../utils/expenseUtils";

export async function handleIncome(ctx: BotContext, text: string): Promise<void> {
  console.log("Handling /income command");

  const record = parseRecordMessage(text, false);

  if (!record) {
    await ctx.reply("Invalid format. Use: /income <amount> <description>");
    return;
  }

  const row = [
    record.date,
    record.category,
    record.description,
    record.amount,
    record.uncleared,
  ];

  await ctx.sheetsClient.appendRow(row);
  await ctx.reply(`✅ Recorded income: ฿${record.amount} for ${record.description}`);
}
