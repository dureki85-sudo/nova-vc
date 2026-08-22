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
  cute: "<a:1251cute2:1528440627774095562>",
  england: "<:24bbingiltere:1528439581161029864>",
  blood: "<:32blood:1536474184245579776>",
  kartal: "<:32kartal:1536473942309474374>",
  bebimonarch: "<a:bebis_monarch:1528440464926052523>",
  mavitac: "<a:bmonarch_bluecrown:1528440298030760028>",
  kelebek: "<:butterfly_role1:1528440650985640126>",
  yumruk: "<a:catufkun:1528440740135567541>",
  cilekkedi: "<:cileklikittyingiltere:1528439730335912026>",
  dans: "<a:courtingiltere:1528439660978901222>",
  uyku: "<:dfmonarch_uyku:1528440493220827256>",
  gojo: "<:dmonarch_gojo:1528440437952479332>",
  gezi: "<:dmonarch_trip:1528440552952172717>",
  durum: "<:durum:1536474936665833542>",
  hihi: "<a:emonarch_hihi:1528440592873427064>",
  hipnoz: "<a:emonarch_hyp:1528440780925042688>",
  kizgin: "<a:emonarch_pissk:1528440340774916146>",
  hayalet: "<:ghost:1536473556962123809>",
  logo: "<:hangout_discordlogo:1532662299356041216>",
  instagram: "<:instagramlogoingiltere:1528439789572063252>",
  iptal: "<a:iptal:1528454352333963334>",
  kabe: "<:kaabearabistan:1536473773975408764>",
  dansedenkedi: "<a:kittycikdansingiltere:1528439855573635203>",
  kurdele: "<:kurdeleingiltere:1536474714309140592>",
  kurdistan: "<:kurdistan:1536473021207023667>",
  kusdans: "<a:kusdans:1532662374258053121>",
  baris: "<:mavidevingiltere:1528439925257801870>",
  mor: "<:mortikingiltere:1528440097848950954>",
  nazar: "<:nazar:1536474254894440559>",
  ninja: "<:ninjaingiltere:1536474657283379330>",
  sahip: "<:owner:1531609807696691333>",
  kirmizitac: "<:redcrowningiltere:1528440264643838124>",
  ozel: "<:special:1536474799780663397>",
  wumpus: "<:swenzy_wumpushappy:1536474517071990834>",
  uye: "<:uye:1532665791663702108>",
  siyahonay: "<:verifiedblackingiltere:1528440062927442131>",
  onay: "<a:verifiedingiltere:1528440026743181314>",
  gokyuzuonay: "<a:verifiedskyblueingiltere:1528439997894758562>",
  beyaztac: "<a:wmonarch_crown:1528440406289809559>",
  yetkili: "<:yetkili:1531607810096234616>"
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
