import { BotContext } from "../context";
import { parseRecordMessage } from "../utils/expense";

export async function handleExpense(ctx: BotContext, text: string): Promise<void> {
  console.log("Handling /expense command");

  const record = parseRecordMessage(text, true);

  if (!record) {
    await ctx.reply("Invalid format. Use: /expense <amount> <description> [category]");
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
  await ctx.reply(`✅ Recorded expense: ฿${record.amount} for ${record.description}`);
}
