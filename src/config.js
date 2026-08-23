const COLORS = {
  blurple: 0x5865f2,
  green: 0x57f287,
  yellow: 0xfeec5c,
  red: 0xed4245,
  dark: 0x2b2d31
};

const THEME_EMOJIS = [
  "🌌", "🚀", "🛸", "🌙", "⭐", "🔥", "💎", "👑", "🎧", "🎮",
  "🌊", "🌴", "⚡", "🌪️", "🦋", "🐺", "🦅", "🐉", "🔮", "🕯️",
  "🏔️", "🌋", "🌈", "☄️", "🪐", "🌠", "🎆", "🎇", "✨", "💫"
];

const COOLDOWN_MS = 5000;
const EMPTY_DELETE_MS = 45000;
const CLEANUP_INTERVAL_MS = 15000;
const PANEL_DEBOUNCE_MS = 800;
const NAME_MAX_LENGTH = 30;

const CUSTOM_EMOJIS = {
  logo: "<a:discord:1509545365542539274>",
  kusdans: "<a:HogeldinizGifDouTuraYrk4:1509550026484088975>",
  hihi: "<a:uwu_you_made_me_blush:1509548656171159654>",
  ozel: "<a:VIP:1509546753043730523>",
  beyaztac: "<:Tac:1508846363088126026>",
  ninja: "<a:boom:1509547118749028444>",
  wumpus: "<a:nitro:1509546179308949567>",
  kelebek: "<a:bilgi:1509545549853098124>",
  durum: "<a:ayarlamali:1509544964621865021>",
  england: "<:Discord:1508845643865653330>",
  kartal: "<a:Red_Bolt:1509548391129022674>",
  dans: "<a:Valerian_yildiz:1508850449514758174>",
  onay: "<a:tik1:1508849998954106950>",
  siyahonay: "<:developer:1508850642968379554>",
  nazar: "<a:uyari:1508849769634861347>",
  hayalet: "<a:Etrollface2:1509545879202304122>",
  gokyuzuonay: "<:tik:1508842078770302986>",
  iptal: "<a:red:1508842246793854996>",
  uye: "<:musteri:1508846617598623828>",
  bebimonarch: "<a:1743_Ayicik30:1509547993429315807>",
  sahip: "<:Tac:1508846364564656321>",
  kurdele: "<:sponsor:1508860747474538496>",
  cilekkedi: "<a:kittysuprise:1509549604109287525>",
  dansedenkedi: "<a:dealwithit:1509549750641492161>",
  cute: "<a:emoji_288:1509548723074764994>",
  gojo: "<a:sol:1508847260203618332>",
  gezi: "<a:sag:1508847124853428257>",
  uyku: "<:nah:1508850127480291338>",
  mor: "<a:nitro:1509546182165270578>",
  siparis: "<a:siparis:1508829336801771531>",
  destek: "<:destek:1508846872201007286>",
  robux: "<a:robux:1508845983315001414>",
  pc: "<a:pc:1508850853568581753>",
  unlem: "<a:unlem:1508860772032446487>",
  bot: "<:bot:1508829179037352056>",
  tek: "<:Single:1508850057196212296>",
  uyuzmusun: "<:uyuzmusun:1508850172036387028>",
  lan: "<a:lan:1509548765109944320>",
  aglama: "<a:CryingManAnimated:1508850325258371133>",
  yildiz: "<a:Valerian_yildiz:1508850449514758174>",
  nike: "<a:nike:1509545708972281856>",
  ayicik: "<a:1743_Ayicik30:1509547993429315807>",
  vaporeon: "<a:pr_vaporeon:1509548607433478155>",
  msmuyar: "<a:msmuyar:1509548360665665606>",
  kirmizibolt: "<a:Red_Bolt:1509548391129022674>",
  lol: "<:lol_logo_hd:1540694991591047241>",
  rivals: "<:Rivals:1540696566623641652>",
  overwatch: "<:overwatch:1540696643819536534>",
  dv: "<a:dv:1509547755650027550>",
  emote1: "<a:emote1:1509547808636801155>"
};

const INVITE_PERMISSIONS = "17894416";

const BRAND_FOOTER = `-# NOVA © 2026 • Sunucunu boostlamayı unuttun mu? ${CUSTOM_EMOJIS.mor}`;

function sanitizeName(name) {
  const cleaned = String(name)
    .replace(/[/\\:*?"<>|]/g, "")
    .trim();
  if (!cleaned) return "Oda";
  return cleaned.slice(0, NAME_MAX_LENGTH);
}

function randomRoomName(ownerName) {
  const emoji = THEME_EMOJIS[Math.floor(Math.random() * THEME_EMOJIS.length)];
  const base = sanitizeName(ownerName || "Usta");
  return `${emoji} ${base}'nin Odası`;
}

module.exports = {
  COLORS,
  THEME_EMOJIS,
  CUSTOM_EMOJIS,
  COOLDOWN_MS,
  EMPTY_DELETE_MS,
  CLEANUP_INTERVAL_MS,
  PANEL_DEBOUNCE_MS,
  NAME_MAX_LENGTH,
  INVITE_PERMISSIONS,
  BRAND_FOOTER,
  sanitizeName,
  randomRoomName
};
