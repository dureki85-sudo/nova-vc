const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags
} = require("discord.js");

const db = require("./db");
const ui = require("./ui");
const vcManager = require("./vcManager");
const { getServerEmojiTags } = require("./config");

const vcCommand = new SlashCommandBuilder()
  .setName("vc")
  .setDescription("🔊 NOVA özel kanal sistemi")
  .addSubcommand((sub) =>
    sub
      .setName("panel")
      .setDescription("📢 Kurulum panelini bu kanala gönder")
  )
  .addSubcommand((sub) =>
    sub
      .setName("setup")
      .setDescription("⚙ Oda sistemini kur")
      .addChannelOption((option) =>
        option
          .setName("kategori")
          .setDescription("📂 Odaların açılacağı kategori")
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true)
      )
      .addChannelOption((option) =>
        option
          .setName("giris_odasi")
          .setDescription("🚪 Join-to-Create ses kanalı (opsiyonel)")
          .addChannelTypes(ChannelType.GuildVoice)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) => sub.setName("istatistik").setDescription("📊 Bot istatistiklerini gör"));

const emojilerCommand = new SlashCommandBuilder()
  .setName("emojiler")
  .setDescription("😀 Sunucudaki tüm emojileri listeler");

function collectEmojiTags(guild) {
  return getServerEmojiTags(guild);
}

async function handleEmojiler(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const emojis = collectEmojiTags(interaction.guild);
  return interaction.editReply(
    ui.payload(ui.buildEmojiListPage(emojis))
  );
}

async function registerCommands(client) {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const body = [vcCommand.toJSON(), emojilerCommand.toJSON()];
  await rest.put(Routes.applicationCommands(client.user.id), { body });
  if (process.env.GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body }
    );
  }
}

function errorPayload(reason, extra = 0) {
  return ui.payload(ui.buildErrorCard(reason), extra);
}

function actionResultPayload(result, okTitle, okBody, extra = 0) {
  if (result.status === "denied") {
    return errorPayload(
      "Bu işlem için oda sahibi ya da **Kanalları Yönet** yetkisi gerekir 🔑",
      extra
    );
  }
  if (result.status === "gone") {
    return errorPayload("Bu kanal artık NOVA odası değil 🧹", extra);
  }
  if (result.status === "error") {
    return errorPayload(result.reason, extra);
  }
  return ui.payload(ui.buildNoticeCard(okTitle, okBody), extra);
}

async function handleStatsRequest(interaction) {
  const client = interaction.client;
  const stats = {
    activeRooms: db.getAllRooms().length,
    totalRooms: db.getTotalCreated(),
    guildCount: client.guilds.cache.size,
    ping: Math.max(0, Math.round(client.ws.ping)),
    uptimeMs: client.uptime,
    version: require("discord.js/package.json").version
  };
  return interaction.reply(ui.payload(ui.buildStatsCard(stats)));
}

async function handleSlashCommand(interaction) {
  const client = interaction.client;
  const guild = interaction.guild;
  const sub = interaction.options.getSubcommand();

  if (sub === "panel") {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply(
        errorPayload("Bu komut için **Sunucuyu Yönet** yetkisi gerekir 🛡", MessageFlags.Ephemeral)
      );
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const panelContainer = ui.buildMainPanel(
      client.user.displayAvatarURL({ extension: "png", size: 256 }),
      guild.name
    );
    try {
      await interaction.channel.send(ui.payload(panelContainer));
      return interaction.editReply(
        ui.payload(ui.buildNoticeCard("Panel Gönderildi!", "Panel aşağıya indirildi 🚀"))
      );
    } catch (err) {
      return interaction.editReply(
        errorPayload(`Panel gönderilemedi 📨 **Sebep:** ${err.message}`)
      );
    }
  }

  if (sub === "setup") {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply(
        errorPayload("Bu komut için **Sunucuyu Yönet** yetkisi gerekir 🛡", MessageFlags.Ephemeral)
      );
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let category = interaction.options.getChannel("kategori");
    if (!category || category.guildId !== guild.id) {
      category = await vcManager.ensureCategory(guild);
    }
    if (!category) {
      return interaction.editReply(errorPayload("Kategori bulunamadı ve oluşturulamadı 📂"));
    }

    const jtc = interaction.options.getChannel("giris_odasi");
    const cfg = db.getGuild(guild.id);
    cfg.categoryId = category.id;
    cfg.jtcChannelId = jtc ? jtc.id : null;
    db.save();

    return interaction.editReply(ui.payload(ui.buildSetupSuccessCard(category.id, cfg.jtcChannelId)));
  }
}

function roomChannelFromInteraction(interaction) {
  return interaction.guild?.channels.cache.get(interaction.channelId) || null;
}

async function handleCreateButton(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const result = await vcManager.createRoomForMember(interaction.member);

  if (result.status === "cooldown") {
    const seconds = Math.ceil(result.remainingMs / 1000);
    return interaction.editReply(
      errorPayload(`⏳ Çok hızlısın! **${seconds} saniye** bekleyip tekrar dene 💜`)
    );
  }
  if (result.status === "moved") {
    return interaction.editReply(ui.payload(ui.buildWarningAlreadyOwned(result.channelId)));
  }
  if (result.status === "error") {
    return interaction.editReply(errorPayload(result.reason));
  }
  return interaction.editReply(
    ui.payload(ui.buildRoomCreatedCard(result.channelId, interaction.member.id))
  );
}

async function handleButton(interaction) {
  const { customId } = interaction;

  if (customId === "nova:room:create") return handleCreateButton(interaction);

  if (customId === "nova:guide") {
    return interaction.reply(ui.payload(ui.buildGuide(), MessageFlags.Ephemeral));
  }

  if (customId === "nova:stats") {
    return handleStatsRequest(interaction);
  }

  const channel = roomChannelFromInteraction(interaction);
  if (!channel) {
    return interaction.reply(errorPayload("Oda bulunamadı 🧹", MessageFlags.Ephemeral));
  }

  switch (customId) {
    case "nova:lock": {
      const result = await vcManager.toggleLock(channel, interaction.member);
      const lockedNow = result.room ? result.room.locked : false;
      return interaction.reply(
        actionResultPayload(
          result,
          lockedNow ? "Oda Kilitlendi 🔒" : "Kilit Açıldı 🔓",
          lockedNow
            ? "Artık sadece izinli üyeler girebilir 🚪"
            : "Kapılar herkese açık! 🎉",
          MessageFlags.Ephemeral
        )
      );
    }
    case "nova:ghost": {
      const result = await vcManager.toggleGhost(channel, interaction.member);
      const hiddenNow = result.room ? result.room.hidden : false;
      return interaction.reply(
        actionResultPayload(
          result,
          hiddenNow ? "Oda Gizlendi 👻" : "Oda Görünür Oldu 👁",
          hiddenNow ? "Odan listeden kayboldu, tam mahremiyet 🕶" : "Odan listede tekrar görünüyor ✨",
          MessageFlags.Ephemeral
        )
      );
    }
    case "nova:delete": {
      const result = await vcManager.destroyRoom(channel, interaction.member);
      return interaction.reply(
        actionResultPayload(result, "Oda Silindi 🗑", "Umarım tekrar görüşürüz 👋", MessageFlags.Ephemeral)
      );
    }
    case "nova:limit":
      return interaction.showModal(ui.buildLimitModal());
    case "nova:rename": {
      const room = db.getRoom(interaction.guildId, channel.id);
      return interaction.showModal(ui.buildRenameModal(room ? room.name : ""));
    }
    case "nova:claim": {
      const result = await vcManager.claimOwnership(channel, interaction.member);
      return interaction.reply(
        actionResultPayload(result, "Taç Senin! 👑", "Bu odanın yeni sahibi sensin 💜", MessageFlags.Ephemeral)
      );
    }
    case "nova:details": {
      const room = db.getRoom(interaction.guildId, channel.id);
      if (!room) {
        return interaction.reply(errorPayload("Bu kanal artık NOVA odası değil 🧹", MessageFlags.Ephemeral));
      }
      return interaction.reply(
        ui.payload(
          ui.buildDetailsCard(vcManager.getLiveState(channel, room)),
          MessageFlags.Ephemeral
        )
      );
    }
    default:
      return interaction.reply(errorPayload("Bilinmeyen buton 🤖", MessageFlags.Ephemeral));
  }
}

async function handleSelectMenu(interaction) {
  const channel = roomChannelFromInteraction(interaction);
  if (!channel) {
    return interaction.reply(errorPayload("Oda bulunamadı 🧹", MessageFlags.Ephemeral));
  }

  switch (interaction.customId) {
    case "nova:allow": {
      const result = await vcManager.allowMembers(channel, interaction.member, interaction.values);
      const names = interaction.values.map((id) => `<@${id}>`).join(", ");
      return interaction.reply(
        actionResultPayload(result, "İzin Verildi ➕", `${names} artık odaya girebilir 🚪`, MessageFlags.Ephemeral)
      );
    }
    case "nova:deny": {
      const result = await vcManager.denyMembers(channel, interaction.member, interaction.values);
      const names = interaction.values.map((id) => `<@${id}>`).join(", ");
      return interaction.reply(
        actionResultPayload(result, "Yasaklandı 🚫", `${names} odadan uzaklaştırıldı 🦵`, MessageFlags.Ephemeral)
      );
    }
    case "nova:transfer": {
      const result = await vcManager.transferOwnership(
        channel,
        interaction.member,
        interaction.values
      );
      const target = interaction.values[0] ? `<@${interaction.values[0]}>` : "?";
      return interaction.reply(
        actionResultPayload(result, "Sahiplik Devredildi 👑", `Yeni sahip: ${target} 💜`, MessageFlags.Ephemeral)
      );
    }
    default:
      return interaction.reply(errorPayload("Bilinmeyen seçim menüsü 🤖", MessageFlags.Ephemeral));
  }
}

async function handleModalSubmit(interaction) {
  const channel = roomChannelFromInteraction(interaction);
  if (!channel) {
    return interaction.reply(errorPayload("Oda bulunamadı 🧹", MessageFlags.Ephemeral));
  }

  if (interaction.customId === "nova-modal-limit") {
    const raw = interaction.fields.getTextInputValue("limit-input");
    const result = await vcManager.setLimit(channel, interaction.member, raw);
    const limitText =
      result.room && result.room.userLimit > 0 ? `${result.room.userLimit} kişi` : "sınırsız ∞";
    return interaction.reply(
      actionResultPayload(result, "Limit Güncellendi ⚙", `Yeni sınır: **${limitText}**`, MessageFlags.Ephemeral)
    );
  }

  if (interaction.customId === "nova-modal-rename") {
    const raw = interaction.fields.getTextInputValue("rename-input");
    const cleaned = raw.replace(/[/\\:*?"<>|]/g, "").trim().slice(0, 30) || "Oda";
    const result = await vcManager.renameRoom(channel, interaction.member, raw);
    return interaction.reply(
      actionResultPayload(result, "İsim Güncellendi ✏", `Yeni ad: **${cleaned}**`, MessageFlags.Ephemeral)
    );
  }
}

async function handleInteraction(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "emojiler") {
        return await handleEmojiler(interaction);
      }
      if (interaction.commandName !== "vc") return;
      if (interaction.options.getSubcommand() === "istatistik") {
        return await handleStatsRequest(interaction);
      }
      return await handleSlashCommand(interaction);
    }
    if (interaction.isButton()) return await handleButton(interaction);
    if (interaction.isUserSelectMenu()) return await handleSelectMenu(interaction);
    if (interaction.isModalSubmit()) return await handleModalSubmit(interaction);
  } catch (err) {
    console.error("[NOVA] Etkileşim hatası:", err);
    const payloadObj = errorPayload(
      `Beklenmeyen hata 🔄\n\`${err.message}\`\n\`code: ${err.code || "yok"}\``,
      MessageFlags.Ephemeral
    );
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payloadObj);
      } else {
        await interaction.reply(payloadObj);
      }
    } catch {}
  }
}

module.exports = { vcCommand, registerCommands, handleInteraction };
