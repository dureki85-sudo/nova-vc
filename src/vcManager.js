const { ChannelType, PermissionFlagsBits } = require("discord.js");

const db = require("./db");
const ui = require("./ui");
const {
  COOLDOWN_MS,
  EMPTY_DELETE_MS,
  CLEANUP_INTERVAL_MS,
  PANEL_DEBOUNCE_MS,
  randomRoomName,
  sanitizeName
} = require("./config");

const DEFAULT_CATEGORY_NAME = "🔊 ÖZEL KANALLAR";
const OWNER_ALLOW = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
  PermissionFlagsBits.MoveMembers
];
const BOT_ALLOW = [
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.MoveMembers
];

const cooldowns = new Map();
const panelTimers = new Map();
let clientRef = null;
let cleanupTimer = null;

function checkCooldown(userId) {
  const now = Date.now();
  const last = cooldowns.get(userId) || 0;
  const remaining = COOLDOWN_MS - (now - last);
  if (remaining > 0) return remaining;
  cooldowns.set(userId, now);
  return 0;
}

function canManage(member, room) {
  if (!member) return false;
  return room.ownerId === member.id || member.permissions.has(PermissionFlagsBits.ManageChannels);
}

async function ensureCategory(guild) {
  const cfg = db.getGuild(guild.id);
  let category = cfg.categoryId ? guild.channels.cache.get(cfg.categoryId) : null;
  if (category && category.type !== ChannelType.GuildCategory) category = null;
  if (!category) {
    category =
      guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === DEFAULT_CATEGORY_NAME
      ) || null;
  }
  if (!category) {
    const me = guild.members.me;
    if (!me || !me.permissions.has(PermissionFlagsBits.ManageChannels)) return null;
    category = await guild.channels
      .create({ name: DEFAULT_CATEGORY_NAME, type: ChannelType.GuildCategory })
      .catch(() => null);
  }
  if (category) {
    cfg.categoryId = category.id;
    db.save();
  }
  return category;
}

function getLiveState(channel, room) {
  return {
    channelId: channel.id,
    ownerId: room.ownerId,
    createdAt: room.createdAt,
    locked: room.locked,
    hidden: room.hidden,
    userLimit: room.userLimit,
    memberIds: [...channel.members.keys()],
    iconUrl: channel.guild.iconURL({ extension: "png", size: 128 }) || null
  };
}

async function applyOverwrites(channel, room) {
  const everyoneDeny = [];
  if (room.locked) everyoneDeny.push(PermissionFlagsBits.Connect);
  if (room.hidden) {
    everyoneDeny.push(PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel);
  }

  const overwrites = [
    { id: channel.guild.roles.everyone.id, allow: [], deny: everyoneDeny },
    { id: room.ownerId, allow: OWNER_ALLOW, deny: [] }
  ];

  for (const id of new Set(room.allowedUserIds)) {
    if (id === room.ownerId) continue;
    overwrites.push({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect], deny: [] });
  }
  for (const id of new Set(room.deniedUserIds)) {
    if (id === room.ownerId) continue;
    overwrites.push({
      id,
      allow: [],
      deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
    });
  }

  const botId = clientRef?.user?.id;
  if (botId) overwrites.push({ id: botId, allow: BOT_ALLOW, deny: [] });

  await channel.permissionOverwrites.set(overwrites.filter((o) => o.allow !== undefined || o.deny !== undefined));
}

async function createRoomForMember(member) {
  const guild = member.guild;
  const remainingMs = checkCooldown(member.id);
  if (remainingMs > 0) {
    return { status: "cooldown", remainingMs };
  }

  const existing = db.findRoomByOwner(guild.id, member.id);
  if (existing) {
    const existingChannel = guild.channels.cache.get(existing.channelId);
    if (existingChannel) {
      await member.voice.setChannel(existingChannel).catch(() => {});
      return { status: "moved", channelId: existing.channelId };
    }
    db.deleteRoom(guild.id, existing.channelId);
  }

  const me = guild.members.me;
  if (!me || !me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return {
      status: "error",
      reason: "Bota **Kanalları Yönet** yetkisi verilmemiş. Yöneticiye haber ver! 🛠"
    };
  }

  const category = await ensureCategory(guild);
  if (!category) {
    return {
      status: "error",
      reason: "Kategori bulunamadı ve yenisi oluşturulamadı. `/vc setup` ile ayarla 📂"
    };
  }

  const channel = await guild.channels
    .create({
      name: randomRoomName(member.user?.username || member.displayName),
      type: ChannelType.GuildVoice,
      parent: category.id
    })
    .catch(() => null);

  if (!channel) {
    return { status: "error", reason: "Kanal oluşturulamadı, yetkileri kontrol et 🔧" };
  }

  const room = {
    ownerId: member.id,
    name: channel.name,
    createdAt: Date.now(),
    locked: false,
    hidden: false,
    userLimit: 0,
    memberIds: [member.id],
    allowedUserIds: [],
    deniedUserIds: [],
    panelMessageId: null,
    lastEmptyAt: null
  };
  db.setRoom(guild.id, channel.id, room);

  await applyOverwrites(channel, room).catch(() => {});

  await member.voice.setChannel(channel).catch(() => {});

  try {
    const panelMsg = await channel.send(ui.payload(ui.buildControlPanel(getLiveState(channel, room))));
    room.panelMessageId = panelMsg.id;
    db.save();
  } catch {}

  const guildData = db.getGuild(guild.id);
  guildData.stats.created += 1;
  db.save();

  return { status: "created", channelId: channel.id };
}

async function resendOrEditPanel(channel) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return;
  const payloadObj = ui.payload(ui.buildControlPanel(getLiveState(channel, room)));

  if (room.panelMessageId) {
    try {
      const msg = await channel.messages.fetch(room.panelMessageId);
      await msg.edit(payloadObj);
      return;
    } catch {}
  }

  try {
    const msg = await channel.send(payloadObj);
    room.panelMessageId = msg.id;
    db.save();
  } catch {}
}

function queueRefresh(channel) {
  const previous = panelTimers.get(channel.id);
  if (previous) clearTimeout(previous);
  const timer = setTimeout(() => {
    panelTimers.delete(channel.id);
    resendOrEditPanel(channel).catch(() => {});
  }, PANEL_DEBOUNCE_MS);
  panelTimers.set(channel.id, timer);
}

async function syncRoomMembership(channel, room) {
  const memberIds = [...channel.members.keys()];
  room.memberIds = memberIds;
  db.save();

  if (!memberIds.includes(room.ownerId) && memberIds.length > 0) {
    const newOwnerId = memberIds[0];
    room.ownerId = newOwnerId;
    room.deniedUserIds = room.deniedUserIds.filter((id) => id !== newOwnerId);
    room.allowedUserIds = room.allowedUserIds.filter((id) => id !== newOwnerId);
    await channel.permissionOverwrites.delete(newOwnerId).catch(() => {});
    await applyOverwrites(channel, room).catch(() => {});
    db.save();
  }

  if (memberIds.length === 0) {
    if (!room.lastEmptyAt) room.lastEmptyAt = Date.now();
    db.save();
  } else if (room.lastEmptyAt) {
    room.lastEmptyAt = null;
    db.save();
  }

  queueRefresh(channel);
}

async function handleVoiceStateUpdate(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  if (!guild) return;
  const cfg = db.getGuild(guild.id);

  const joinedId = newState.channelId;
  const leftId = oldState.channelId;

  if (joinedId && joinedId !== leftId && cfg.jtcChannelId === joinedId && newState.member) {
    await createRoomForMember(newState.member);
  }

  const touched = new Set([leftId, joinedId].filter(Boolean));
  for (const channelId of touched) {
    const room = db.getRoom(guild.id, channelId);
    if (!room) continue;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      db.deleteRoom(guild.id, channelId);
      continue;
    }
    await syncRoomMembership(channel, room);
  }
}

async function cleanupTick() {
  if (!clientRef) return;
  const now = Date.now();
  for (const entry of db.getAllRooms()) {
    if (!entry.room.lastEmptyAt) continue;
    if (now - entry.room.lastEmptyAt < EMPTY_DELETE_MS) continue;
    const guild = clientRef.guilds.cache.get(entry.guildId);
    const channel = guild?.channels.cache.get(entry.channelId) || null;
    db.deleteRoom(entry.guildId, entry.channelId);
    if (channel) await channel.delete("NOVA • boş oda temizliği 🧹").catch(() => {});
  }
}

function startAutomation(client) {
  clientRef = client;
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    cleanupTick().catch(() => {});
  }, CLEANUP_INTERVAL_MS);
}

function syncAllPanels(client) {
  clientRef = client;
  for (const entry of db.getAllRooms()) {
    const channel = client.channels.cache.get(entry.channelId);
    if (channel) queueRefresh(channel);
  }
}

async function toggleLock(channel, member) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  room.locked = !room.locked;
  await applyOverwrites(channel, room).catch(() => {});
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

async function toggleGhost(channel, member) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  room.hidden = !room.hidden;
  await applyOverwrites(channel, room).catch(() => {});
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

async function setLimit(channel, member, rawValue) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  const parsed = parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) return { status: "error", reason: "Geçerli bir sayı gir (0–99) 🔢" };
  const limit = Math.min(Math.max(parsed, 0), 99);
  await channel.setUserLimit(limit).catch(() => {});
  room.userLimit = limit;
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

async function renameRoom(channel, member, rawName) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  const cleaned = sanitizeName(rawName);
  if (!cleaned || cleaned.length === 0) {
    return { status: "error", reason: "İsim boş olamaz ✏️" };
  }
  await channel.setName(cleaned).catch(() => {});
  room.name = cleaned;
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

async function destroyRoom(channel, member) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  db.deleteRoom(channel.guild.id, channel.id);
  const timer = panelTimers.get(channel.id);
  if (timer) clearTimeout(timer);
  panelTimers.delete(channel.id);
  await channel.delete("NOVA • oda sahibi tarafından silindi 🗑").catch(() => {});
  return { status: "ok" };
}

async function claimOwnership(channel, member) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (room.ownerId === member.id) {
    return { status: "error", reason: "Bu oda zaten senin 👑" };
  }
  if (channel.members.has(room.ownerId)) {
    return { status: "error", reason: "Oda sahibi hâlâ içeride, sahiplenemezsin ⏳" };
  }
  room.ownerId = member.id;
  room.deniedUserIds = room.deniedUserIds.filter((id) => id !== member.id);
  room.allowedUserIds = room.allowedUserIds.filter((id) => id !== member.id);
  await applyOverwrites(channel, room).catch(() => {});
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

async function allowMembers(channel, member, userIds) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  const picked = userIds.filter((id) => id !== room.ownerId && !room.deniedUserIds.includes(id));
  if (picked.length === 0) {
    return { status: "error", reason: "Seçilen üyeler zaten yasaklı olabilir 🤔" };
  }
  room.allowedUserIds = [...new Set([...room.allowedUserIds, ...picked])].slice(-3);
  await applyOverwrites(channel, room).catch(() => {});
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

async function denyMembers(channel, member, userIds) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  const picked = userIds.filter((id) => id !== room.ownerId);
  if (picked.length === 0) {
    return { status: "error", reason: "Oda sahibi yasaklanamaz 👑" };
  }
  room.deniedUserIds = [...new Set([...room.deniedUserIds, ...picked])].slice(-3);
  room.allowedUserIds = room.allowedUserIds.filter((id) => !picked.includes(id));
  await applyOverwrites(channel, room).catch(() => {});
  for (const id of picked) {
    const target = channel.members.get(id);
    if (target) await target.voice.disconnect("NOVA • odadan yasaklandı 🚫").catch(() => {});
  }
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

async function transferOwnership(channel, member, userIds) {
  const room = db.getRoom(channel.guild.id, channel.id);
  if (!room) return { status: "gone" };
  if (!canManage(member, room)) return { status: "denied" };
  const targetId = userIds[0];
  if (!targetId) return { status: "error", reason: "Bir üye seçmelisin 👥" };
  if (!channel.members.has(targetId)) {
    return { status: "error", reason: "Taç sadece odadaki birine verilir 👑" };
  }
  room.ownerId = targetId;
  room.deniedUserIds = room.deniedUserIds.filter((id) => id !== targetId);
  room.allowedUserIds = room.allowedUserIds.filter((id) => id !== targetId);
  await applyOverwrites(channel, room).catch(() => {});
  db.save();
  queueRefresh(channel);
  return { status: "ok", room };
}

module.exports = {
  checkCooldown,
  canManage,
  ensureCategory,
  createRoomForMember,
  getLiveState,
  queueRefresh,
  startAutomation,
  syncAllPanels,
  handleVoiceStateUpdate,
  toggleLock,
  toggleGhost,
  setLimit,
  renameRoom,
  destroyRoom,
  claimOwnership,
  allowMembers,
  denyMembers,
  transferOwnership
};
