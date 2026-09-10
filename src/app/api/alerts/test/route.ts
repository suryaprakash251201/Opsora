import { sendTestAlert } from "@/lib/server/alert-dispatcher";

export async function POST() {
  const results = await sendTestAlert();

  if (results.length === 0) {
    return Response.json(
      {
        results,
        message:
          "No alert channels configured. Set TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID or DISCORD_WEBHOOK_URL.",
      },
      { status: 400 },
    );
  }

  return Response.json({ results });
}
