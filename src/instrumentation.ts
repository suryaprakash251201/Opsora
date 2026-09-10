export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAlertDispatcher } = await import(
      "./lib/server/alert-dispatcher"
    );
    startAlertDispatcher();
  }
}
