export type ChannelId = "telegram" | "discord";

export interface ChannelStatus {
  id: ChannelId;
  label: string;
  configured: boolean;
  /** Environment variables required to configure this channel. */
  hint: string;
}

export interface ChannelSendResult {
  id: ChannelId;
  ok: boolean;
  error?: string;
}

export function getChannelStatuses(): ChannelStatus[] {
  const telegramConfigured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_CHAT_ID?.trim(),
  );
  const discordConfigured = Boolean(process.env.DISCORD_WEBHOOK_URL?.trim());

  return [
    {
      id: "telegram",
      label: "Telegram",
      configured: telegramConfigured,
      hint: "TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID",
    },
    {
      id: "discord",
      label: "Discord",
      configured: discordConfigured,
      hint: "DISCORD_WEBHOOK_URL",
    },
  ];
}

async function responseError(response: Response): Promise<string> {
  const body = await response.text();
  return `${response.status} ${body.slice(0, 160)}`;
}

async function sendTelegram(text: string): Promise<ChannelSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return { id: "telegram", ok: false, error: "Not configured" };

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { id: "telegram", ok: false, error: await responseError(response) };
    }
    return { id: "telegram", ok: true };
  } catch (error) {
    return {
      id: "telegram",
      ok: false,
      error: error instanceof Error ? error.message : "Send failed",
    };
  }
}

async function sendDiscord(text: string): Promise<ChannelSendResult> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) return { id: "discord", ok: false, error: "Not configured" };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { id: "discord", ok: false, error: await responseError(response) };
    }
    return { id: "discord", ok: true };
  } catch (error) {
    return {
      id: "discord",
      ok: false,
      error: error instanceof Error ? error.message : "Send failed",
    };
  }
}

/** Sends the same message to every configured channel. */
export async function sendToChannels(
  text: string,
): Promise<ChannelSendResult[]> {
  const results: ChannelSendResult[] = [];

  if (process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    results.push(await sendTelegram(text));
  }
  if (process.env.DISCORD_WEBHOOK_URL?.trim()) {
    results.push(await sendDiscord(text));
  }

  return results;
}
