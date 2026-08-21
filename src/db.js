const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

let cache = { guilds: {} };

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        cache = { guilds: parsed.guilds || {} };
      }
    }
  } catch {
    cache = { guilds: {} };
  }
  return cache;
}

function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), "utf8");
  } catch (err) {
    console.error("[NOVA] Veritabanı yazma hatası:", err.message);
  }
}

function getGuild(guildId) {
  if (!cache.guilds[guildId]) {
    cache.guilds[guildId] = {
      categoryId: null,
      jtcChannelId: null,
      stats: { created: 0 },
      rooms: {}
    };
  }
  return cache.guilds[guildId];
}

function getRoom(guildId, channelId) {
  const guild = getGuild(guildId);
  return guild.rooms[channelId] || null;
}

function setRoom(guildId, channelId, room) {
  const guild = getGuild(guildId);
  guild.rooms[channelId] = room;
  save();
}

function deleteRoom(guildId, channelId) {
  const guild = getGuild(guildId);
  if (guild.rooms[channelId]) {
    delete guild.rooms[channelId];
    save();
  }
}

function findRoomByOwner(guildId, ownerId) {
  const guild = getGuild(guildId);
  for (const [channelId, room] of Object.entries(guild.rooms)) {
    if (room.ownerId === ownerId) return { channelId, room };
  }
  return null;
}

function getAllRooms() {
  const entries = [];
  for (const [guildId, data] of Object.entries(cache.guilds)) {
    for (const [channelId, room] of Object.entries(data.rooms || {})) {
      entries.push({ guildId, channelId, room });
    }
  }
  return entries;
}

function getTotalCreated() {
  let sum = 0;
  for (const data of Object.values(cache.guilds)) {
    sum += data.stats?.created || 0;
  }
  return sum;
}

module.exports = { load, save, getGuild, getRoom, setRoom, deleteRoom, findRoomByOwner, getAllRooms, getTotalCreated };
