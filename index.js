require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType
} = require("discord.js");

const db = require("./src/db");
const vcManager = require("./src/vcManager");
const { registerCommands, handleInteraction } = require("./src/handlers");

if (!process.env.DISCORD_TOKEN) {
  console.log(
    [
      "",
      "  ╔══════════════════════════════════════════════╗",
      "  ║  💜 NOVA — Discord token bulunamadı!         ║",
      "  ╠══════════════════════════════════════════════╣",
      "  ║  1. Bu klasörde .env dosyası oluştur.        ║",
      "  ║  2. İçine şunu yaz:                          ║",
      "  ║     DISCORD_TOKEN=bot_tokenin_burada         ║",
      "  ║  3. (Opsiyonel) GUILD_ID=test_sunucu_id      ║",
      "  ║  4. Tekrar başlat: npm start                 ║",
      "  ╚══════════════════════════════════════════════╝",
      ""
    ].join("\n")
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel]
});

client.once("clientReady", async (readyClient) => {
  db.load();
  vcManager.startAutomation(readyClient);
  try {
    await registerCommands(readyClient);
    console.log(`[NOVA] Komutlar kaydedildi ✨ (${readyClient.user.tag})`);
  } catch (err) {
    console.error("[NOVA] Komut kaydı başarısız:", err.message);
  }
  vcManager.syncAllPanels(readyClient);

  readyClient.user.setActivity("🔊 /vc • Özel Odalar", { type: ActivityType.Watching });
  console.log(`[NOVA] Hazır! 🚀 ${readyClient.guilds.cache.size} sunucu servis ediliyor 💜`);
});

client.on("interactionCreate", (interaction) => handleInteraction(interaction));

client.on("voiceStateUpdate", (oldState, newState) => {
  vcManager.handleVoiceStateUpdate(oldState, newState).catch((err) => {
    console.error("[NOVA] Ses durumu hatası:", err);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("[NOVA] Yakalanmamış promise reddi:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[NOVA] Yakalanmamış istisna:", err);
});

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("[NOVA] Giriş başarısız oldu:", err.message);
  console.log("[NOVA] .env içindeki DISCORD_TOKEN değerini kontrol et 💜");
  process.exit(1);
});
