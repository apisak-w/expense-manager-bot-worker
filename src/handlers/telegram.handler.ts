import { Context } from "hono";
import { Env } from "../types/env";
import { KvUserRepository } from "../infrastructure/kvUserRepository";
import { AuthService } from "../services/auth.service";
import { BotService } from "../services/bot.service";

export const handleTelegramWebhook = async (
  c: Context<{ Bindings: Env }>
): Promise<Response> => {
  const env = c.env;
  const missingEnvs: string[] = [];
  if (!env.TELEGRAM_BOT_TOKEN) missingEnvs.push("TELEGRAM_BOT_TOKEN");
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) missingEnvs.push("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!env.GOOGLE_SHEET_ID) missingEnvs.push("GOOGLE_SHEET_ID");
  if (!env.BOT_USERS_KV) missingEnvs.push("BOT_USERS_KV");

  if (missingEnvs.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvs.join(", ")}`);
    // Return 200 to Telegram to avoid retries, even if misconfigured
    return c.text("OK", 200);
  }

  try {
    const userRepo = new KvUserRepository(env.BOT_USERS_KV);
    const authService = new AuthService(userRepo);
    const botService = new BotService(
      {
        telegramToken: env.TELEGRAM_BOT_TOKEN,
        googleServiceAccount: env.GOOGLE_SERVICE_ACCOUNT_JSON,
        googleSheetId: env.GOOGLE_SHEET_ID,
        kvStore: env.BOT_USERS_KV,
      },
      authService
    );

    const body = await c.req.json();
    await botService.handleWebhook(body);

    return c.text("OK", 200);
  } catch (err) {
    console.error("Error handling request:", err);
    return c.text("OK", 200);
  }
};
