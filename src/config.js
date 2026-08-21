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

const INVITE_PERMISSIONS = "17894416";

const BRAND_FOOTER = "-# NOVA © 2026 • Sunucunu boostlamayı unuttun mu? 💜";

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
