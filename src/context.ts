import { SheetsClient } from "./clients/sheets";
import {
  sendTelegramMessage,
  deleteTelegramMessage,
  TelegramResponse,
  TelegramSendOptions,
} from "./clients/telegram";

/**
 * Shared context passed to every command handler.
 * Port of context.py.
 */
export class BotContext {
  readonly token: string;
  readonly chatId: number;
  readonly sheetsClient: SheetsClient;

  constructor(token: string, chatId: number, sheetsClient: SheetsClient) {
    this.token = token;
    this.chatId = chatId;
    this.sheetsClient = sheetsClient;
  }

  async reply(text: string, options: TelegramSendOptions = {}): Promise<TelegramResponse> {
    return sendTelegramMessage(this.token, this.chatId, text, options);
  }

  async deleteMessage(messageId: number): Promise<void> {
    return deleteTelegramMessage(this.token, this.chatId, messageId);
  }
}
