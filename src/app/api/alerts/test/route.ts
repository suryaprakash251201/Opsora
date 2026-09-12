import { sendTestAlert } from "@/lib/server/alert-dispatcher";
import { noStoreJson, apiError } from "@/lib/server/api";

export async function POST() {
  try {
    const results = await sendTestAlert();

    if (results.length === 0) {
      return noStoreJson(
        {
          results,
          message:
            "No alert channels configured. Set TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID or DISCORD_WEBHOOK_URL.",
        },
        { status: 400 },
      );
    }

    return noStoreJson({ results });
  } catch (error) {
    return apiError(error);
  }
}
