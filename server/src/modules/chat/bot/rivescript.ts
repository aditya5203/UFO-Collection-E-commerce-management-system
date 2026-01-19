import path from "path";
import RiveScript from "rivescript";

let bot: RiveScript | null = null;

export async function getBot() {
  if (bot) return bot;

  bot = new RiveScript({ utf8: true });

  // IMPORTANT: run server from /server root so process.cwd() points correctly
  const base = path.join(process.cwd(), "src", "modules", "chat", "bot");

  await bot.loadFile([
    path.join(base, "begin.rive"),
    path.join(base, "dialogue.rive"),
  ]);

  bot.sortReplies();
  return bot;
}

export async function botReply(message: string, username: string) {
  const b = await getBot();
  const reply = await b.reply(username, message);
  return String(reply || "").trim();
}
