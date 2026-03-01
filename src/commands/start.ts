import { BotContext } from "../context";

export async function handleStart(ctx: BotContext): Promise<void> {
  console.log("Handling /start command");

  const welcome = [
    "Hi! I'm your Expense Manager Bot.",
    "",
    "Commands:",
    "/expense <amount> <description> [category]",
    "/income <amount> <description>",
    "/report - Get current month summary",
    "/report [mm-yyyy] - Get specific month summary",
  ].join("\n");

  await ctx.reply(welcome);
}
