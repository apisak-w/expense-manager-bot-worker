import { Env } from "./types/env";
import { KvUserRepository } from "./infrastructure/kvUserRepository";
import { AuthService } from "./services/authService";
import { SheetsClient } from "./clients/sheets";
import { sendTelegramMessage } from "./clients/telegram";
import { BotContext } from "./context";
import { handleStart } from "./commands/start";
import { handleReport } from "./commands/report";
// import { handleExpense } from "./commands/expense";  // Disabled — enable when ready
// import { handleIncome } from "./commands/income";    // Disabled — enable when ready

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { id: number };
    text?: string;
  };
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const missingEnvs: string[] = [];
    if (!env.TELEGRAM_BOT_TOKEN) missingEnvs.push("TELEGRAM_BOT_TOKEN");
    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) missingEnvs.push("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!env.GOOGLE_SHEET_ID) missingEnvs.push("GOOGLE_SHEET_ID");

    if (missingEnvs.length > 0) {
      console.error(`Missing required environment variables: ${missingEnvs.join(", ")}`);
      return new Response("Internal Server Error: missing configuration", {
        status: 500,
      });
    }

    try {
      const data = (await request.json()) as TelegramUpdate;
      const message = data.message;

      if (!message) {
        return new Response("OK", { status: 200 });
      }

      const text = message.text ?? "";
      const chatId = message.chat.id;
      const userId = message.from?.id;

      if (!userId) {
        return new Response("OK", { status: 200 });
      }

      // --- Auth check ----------------------------------------------------------
      const userRepo = new KvUserRepository(env.BOT_USERS_KV);
      const authService = new AuthService(userRepo);
      const user = await authService.authenticate(userId);

      console.log(`User attempt — ID: ${userId}, authorized: ${user.isAuthorized}`);

      if (!user.isAuthorized) {
        const kvEntry = await env.BOT_USERS_KV.get(`user:${userId}`);
        const errorMsg = kvEntry
          ? "🚫 You are not authorized to use this bot."
          : "🚫 You are not registered to use this bot.";
        await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, errorMsg);
        return new Response("OK", { status: 200 });
      }

      // --- Build context -------------------------------------------------------
      const sheetsClient = new SheetsClient(
        env.GOOGLE_SERVICE_ACCOUNT_JSON,
        env.GOOGLE_SHEET_ID
      );
      const ctx = new BotContext(env.TELEGRAM_BOT_TOKEN, chatId, sheetsClient);

      // --- Route ---------------------------------------------------------------
      if (text.startsWith("/start")) {
        await handleStart(ctx);
      } else if (text.startsWith("/report")) {
        await handleReport(ctx, text);
      }
      // else if (text.startsWith("/expense")) { await handleExpense(ctx, text); }
      // else if (text.startsWith("/income"))  { await handleIncome(ctx, text);  }

      return new Response("OK", { status: 200 });
    } catch (err) {
      // Always return 200 to Telegram to avoid infinite webhook retries.
      console.error("Error handling request:", err);
      return new Response("OK", { status: 200 });
    }
  },
};
