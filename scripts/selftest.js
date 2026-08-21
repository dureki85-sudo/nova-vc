const assert = require("assert");
const { MessageFlags } = require("discord.js");

const ui = require("../src/ui");

const AVATAR = ui.FALLBACK_AVATAR;
let failures = 0;

function check(name, containerFn, expectAccent = null) {
  try {
    const container = containerFn();
    const json = JSON.stringify(container.toJSON());
    const payload = ui.payload(container);

    assert.ok(payload.flags & MessageFlags.IsComponentsV2, "IsComponentsV2 bayrağı eksik");
    assert.ok(json.length > 0, "Boş konteyner");
    if (expectAccent !== null) {
      const data = container.toJSON();
      assert.strictEqual(data.accent_color, expectAccent, `accent_color ${data.accent_color}, beklenen ${expectAccent}`);
    }
    console.log(`✅ ${name} — payload ~${(json.length / 1024).toFixed(1)} KB`);
  } catch (err) {
    failures += 1;
    console.error(`❌ ${name} — ${err.message}`);
  }
}

check("Ana /vc Paneli", () => ui.buildMainPanel(AVATAR, "Test Sunucusu"), 0x5865f2);
check("Rehber (renksiz)", () => ui.buildGuide(), undefined);
check("İstatistik Kartı", () =>
  ui.buildStatsCard({
    activeRooms: 3,
    totalRooms: 42,
    guildCount: 7,
    ping: 42,
    uptimeMs: 123456789,
    version: "14.27.0"
  }), 0xfeec5c
);
check("Kurulum Başarı Kartı", () => ui.buildSetupSuccessCard("123", "456"), 0x57f287);
check("Oda Kuruldu Kartı", () => ui.buildRoomCreatedCard("123", "456"), 0x57f287);
check("Bilgi/Detay Kartı", () =>
  ui.buildDetailsCard({
    channelId: "111",
    ownerId: "222",
    name: "🌌 Test Odası",
    createdAt: Date.now(),
    locked: false,
    hidden: false,
    userLimit: 0,
    memberIds: ["333"]
  }), 0x5865f2
);

const baseRoom = {
  channelId: "999888777",
  ownerId: "111222333",
  createdAt: Date.now(),
  locked: false,
  hidden: false,
  userLimit: 5,
  memberIds: ["1", "2"],
  iconUrl: AVATAR
};

check("Kontrol Paneli × Normal (blurple)", () => ui.buildControlPanel(baseRoom), 0x5865f2);
check(
  "Kontrol Paneli × Kilitli (kırmızı)",
  () => ui.buildControlPanel({ ...baseRoom, locked: true }),
  0xed4245
);
check(
  "Kontrol Paneli × Gizli (koyu)",
  () => ui.buildControlPanel({ ...baseRoom, hidden: true }),
  0x2b2d31
);
check("Uyarı Kartı (sarı)", () => ui.buildWarningAlreadyOwned("555"), 0xfeec5c);
check("Hata Kartı (renksiz)", () => ui.buildErrorCard("Bir şeyler ters gitti 🤔"), undefined);
check("Bildirim Kartı", () => ui.buildNoticeCard("Başarılı", "Her şey yolunda 💜"), 0x57f287);
check("Emoji Listesi × Sayfa", () =>
  ui.buildEmojiListPage(
    ["<a:ornek_1:111111111111111111>", "<:ornek_2:222222222222222222>"],
    0,
    3,
    75
  ), 0x5865f2
);
check("Emoji Listesi × Boş", () => ui.buildEmojiListPage([], 0, 1, 0), 0x5865f2);

try {
  const limitModal = ui.buildLimitModal();
  const renameModal = ui.buildRenameModal('🌌/Test:*?"<>| Odası');
  const modalJson = JSON.stringify(limitModal.toJSON());
  assert.ok(modalJson.length > 0, "Limit modali boş");
  assert.ok(JSON.stringify(renameModal.toJSON()).length > 0, "Yeniden adlandırma modali boş");
  assert.ok(!renameModal.toJSON().components[0].components[0].value.includes("/"), "isim temizlenmedi");
  console.log("✅ Modaller (limit + yeniden adlandırma)");
} catch (err) {
  failures += 1;
  console.error(`❌ Modaller — ${err.message}`);
}

console.log("");
if (failures > 0) {
  console.error(`💥 ${failures} test başarısız!`);
  process.exit(1);
}
console.log("🎉 TÜM UI KONTEYNERLERİ DOĞRULANDI • NOVA HAZIR 💜");
