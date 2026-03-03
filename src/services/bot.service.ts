import { AuthService } from "./auth.service";
import { SheetsClient } from "../clients/sheets";
import { BotContext } from "../context";
import { sendTelegramMessage } from "../clients/telegram";
import { handleStart } from "../commands/start";
import { handleReport } from "../commands/report";

export interface BotServiceConfig {
  telegramToken: string;
  googleServiceAccount: string;
  googleSheetId: string;
  kvStore: KVNamespace;
}

export class BotService {
  private readonly config: BotServiceConfig;
  private readonly authService: AuthService;

  constructor(config: BotServiceConfig, authService: AuthService) {
    this.config = config;
    this.authService = authService;
  }

  async handleWebhook(update: {
    message?: {
      chat: { id: number };
      from?: { id: number };
      text?: string;
    };
  }): Promise<void> {
    const message = update.message;
    if (!message) return;

    const text = message.text ?? "";
    const chatId = message.chat.id;
    const userId = message.from?.id;

    if (!userId) return;

    // --- Auth Check ---
    const user = await this.authService.authenticate(userId);
    console.log(`User attempt — ID: ${userId}, authorized: ${user.isAuthorized}`);

    if (!user.isAuthorized) {
      const kvEntry = await this.config.kvStore.get(`user:${userId}`);
      const errorMsg = kvEntry
        ? "🚫 You are not authorized to use this bot."
        : "🚫 You are not registered to use this bot.";
      await sendTelegramMessage(this.config.telegramToken, chatId, errorMsg);
      return;
    }

    // --- Build Context ---
    const sheetsClient = new SheetsClient(
      this.config.googleServiceAccount,
      this.config.googleSheetId
    );
    const ctx = new BotContext(this.config.telegramToken, chatId, sheetsClient);

    // --- Route Command ---
    if (text.startsWith("/start")) {
      await handleStart(ctx);
    } else if (text.startsWith("/report")) {
      await handleReport(ctx, text);
    }
  }
}
