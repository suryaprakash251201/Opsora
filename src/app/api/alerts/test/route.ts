import { sendTestAlert } from "@/lib/server/alert-dispatcher";

export async function POST() {
  try {
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
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
