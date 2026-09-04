const cfg = require("../src/config");
const ui = require("../src/ui");
const db = require("../src/db");
const vm = require("../src/vcManager");
const hd = require("../src/handlers");

let fail = 0;
function check(name, fn) {
  try {
    fn();
    process.stdout.write("OK  " + name + "\n");
  } catch (e) {
    fail++;
    console.log("ERR " + name + ": " + e.message.slice(0, 120));
  }
}

check("config-emoji-count", () => {
  const n = Object.keys(cfg.CUSTOM_EMOJIS).length;
  if (n < 50) throw new Error("sadece " + n + " emoji var");
});

const avatar = cfg.CUSTOM_EMOJIS.logo;
check("ui-mainPanel", () => {
  const c = ui.buildMainPanel(ui.FALLBACK_AVATAR, "Test");
  const j = JSON.stringify(c.toJSON());
  if (j.length < 100) throw new Error("too small");
  if (!j.includes("NOVA")) throw new Error("missing NOVA");
});

check("ui-guide", () => {
  ui.buildGuide();
});

check("ui-stats", () => {
  ui.buildStatsCard({ activeRooms:1, totalRooms:2, guildCount:3, ping:42, uptimeMs:99999, version:"14.27.0" });
});

check("ui-roomCreated", () => {
  ui.buildRoomCreatedCard("111", "222");
});

check("ui-setupSuccess", () => {
  ui.buildSetupSuccessCard("333", "444");
});

check("ui-controlPanel-normal", () => {
  ui.buildControlPanel({ channelId:"555", ownerId:"666", createdAt:Date.now(), locked:false, hidden:false, userLimit:0, memberIds:["1"], iconUrl:null });
});

check("ui-controlPanel-locked", () => {
  ui.buildControlPanel({ channelId:"555", ownerId:"666", createdAt:Date.now(), locked:true, hidden:false, userLimit:5, memberIds:[], iconUrl:null });
});

check("ui-controlPanel-hidden", () => {
  ui.buildControlPanel({ channelId:"555", ownerId:"666", createdAt:Date.now(), locked:false, hidden:true, userLimit:0, memberIds:["1","2"], iconUrl:null });
});

check("ui-error", () => {
  ui.buildErrorCard("test sebep");
});

check("ui-warning", () => {
  ui.buildWarningAlreadyOwned("777");
});

check("ui-notice", () => {
  ui.buildNoticeCard("Baslik", "Icerik");
});

check("ui-details", () => {
  ui.buildDetailsCard({ channelId:"555", ownerId:"666", name:"Test", createdAt:Date.now(), locked:false, hidden:false, userLimit:0, memberIds:["1"] });
});

check("ui-emojiPage", () => {
  const fakeTags = [];
  for (let i = 0; i < 40; i++) fakeTags.push("`<:e" + i + ":" + i + ">`");
  ui.buildEmojiListPage(fakeTags, 0, 3, 100);
});

check("ui-emojiEmpty", () => {
  ui.buildEmojiListPage([], 0, 1, 0);
});

check("ui-limitModal", () => {
  ui.buildLimitModal();
});

check("ui-renameModal", () => {
  ui.buildRenameModal("Test Odasi");
});

check("db-load", () => {
  db.load();
});

check("db-getGuild", () => {
  const g = db.getGuild("test123");
  if (!g) throw new Error("null guild");
  if (!g.stats) throw new Error("no stats");
});

check("db-getAllRooms", () => {
  db.getAllRooms();
});

check("db-getTotalCreated", () => {
  db.getTotalCreated();
});

check("vm-checkCooldown", () => {
  vm.checkCooldown("user_test_1");
});

check("vm-roomOwners", () => {
  db.findRoomByOwner("test123", "nobody");
});

check("vm-getLiveState-mock", () => {
  const fakeChannel = {
    id: "chan1",
    members: { keys: () => ["u1"] },
    guild: { iconURL: () => null }
  };
  const fakeRoom = { channelId:"chan1", ownerId:"u1", createdAt:Date.now(), locked:false, hidden:false, userLimit:0 };
  vm.getLiveState(fakeChannel, fakeRoom);
});

check("ui-payload-with-ephemeral", () => {
  const c = ui.buildErrorCard("test");
  const p = ui.payload(c, 64);
  if ((p.flags & 64) === 0) throw new Error("ephemeral flag missing");
  if ((p.flags & (1 << 15)) === 0) throw new Error("IsComponentsV2 flag missing");
});

console.log("\n--- SUMMARY ---");
if (fail > 0) {
  console.log("FAIL:", fail, "test basarisiz!");
  process.exit(1);
} else {
  console.log("ALL PASS - TUM TESTLER BASARILI");
}
