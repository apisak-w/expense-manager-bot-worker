export interface TelegramSendOptions {
  replyMarkup?: unknown;
  parseMode?: string;
  protectContent?: boolean;
}

export interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: { id: number };
  text?: string;
}

export interface TelegramResponse {
  ok: boolean;
  result?: TelegramMessage;
  description?: string;
}

/**
 * Escapes special characters for Telegram MarkdownV2.
 * Characters: _ * [ ] ( ) ~ ` > # + - = | { } . ! \
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

/**
 * Send a message via the Telegram Bot API.
 */
export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  options: TelegramSendOptions = {}
): Promise<TelegramResponse> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode ?? "Markdown",
    protect_content: options.protectContent ?? false,
  };

  if (options.replyMarkup !== undefined) {
    payload["reply_markup"] = options.replyMarkup;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Telegram API error: ${response.status} ${response.statusText}`, errorText);
    return { ok: false, description: errorText };
  }

  const tgData = (await response.json()) as TelegramResponse;
  if (!tgData.ok) {
    console.error("Telegram API success but ok=false:", tgData);
  }
  return tgData;
}

/**
 * Delete a message via the Telegram Bot API.
 */
export async function deleteTelegramMessage(
  token: string,
  chatId: number,
  messageId: number
): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/deleteMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
  } catch (err) {
    console.error("Error deleting Telegram message:", err);
  }
}
