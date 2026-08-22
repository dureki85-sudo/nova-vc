const {
  ContainerBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require("discord.js");

const { COLORS, BRAND_FOOTER, INVITE_PERMISSIONS, CUSTOM_EMOJIS } = require("./config");

const FALLBACK_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

function payload(container, extraFlags = 0) {
  return {
    flags: MessageFlags.IsComponentsV2 | extraFlags,
    components: [container]
  };
}

function thumbnail(url, description) {
  return new ThumbnailBuilder()
    .setURL(url || FALLBACK_AVATAR)
    .setDescription(description || "NOVA");
}

function separator(large = false) {
  return new SeparatorBuilder()
    .setSpacing(large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small)
    .setDivider(true);
}

function button(customId, label, emoji, style) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setEmoji(emoji)
    .setStyle(style);
}

function buildMainPanel(avatarUrl, guildName) {
  const container = new ContainerBuilder().setAccentColor(COLORS.blurple);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${CUSTOM_EMOJIS.logo} NOVA ÖZEL KANAL\n-# ${CUSTOM_EMOJIS.kusdans} Kendi ses odanı saniyeler içinde kur!`
        )
      )
      .setThumbnailAccessory(thumbnail(avatarUrl, "NOVA"))
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${CUSTOM_EMOJIS.hihi} Merhaba **${guildName}**!\n\n` +
      `Aşağıdaki butona bas ve **kendi özel ses odanı** anında oluştur!\n\n` +
      `> ${CUSTOM_EMOJIS.ozel} Odanı kendin tasarla: kilit, gizlilik, kişi sınırı\n` +
      `> ${CUSTOM_EMOJIS.beyaztac} Odanın sahibi sensin, istediğin gibi yönet\n` +
      `> ${CUSTOM_EMOJIS.ninja} Boş kalınca oda otomatik temizlenir, dağınıklık yok!`
    )
  );

  container.addSeparatorComponents(separator());

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      button("nova:room:create", "Oda Kur", CUSTOM_EMOJIS.wumpus, ButtonStyle.Primary),
      button("nova:guide", "Rehber", CUSTOM_EMOJIS.kelebek, ButtonStyle.Secondary),
      button("nova:stats", "İstatistik", CUSTOM_EMOJIS.durum, ButtonStyle.Secondary)
    )
  );

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(BRAND_FOOTER));

  return container;
}

function buildGuide() {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${CUSTOM_EMOJIS.kelebek} NOVA Rehber\n-# Her şeyin olduğu yer, tek bakışta!`)
  );

  container.addSeparatorComponents(separator());

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `## ${CUSTOM_EMOJIS.wumpus} Oda Kurma\n` +
      `1. Paneldeki **Oda Kur** butonuna bas.\n` +
      `2. Odan anında kurulur ve sen içine taşınırsın.\n` +
      `3. Ses kanalının yanındaki **Oda Kontrol Merkezi** panelinden her şeyi yönet.\n\n` +
      `## ${CUSTOM_EMOJIS.nazar} Kilit & ${CUSTOM_EMOJIS.hayalet} Gizlilik\n` +
      `> **Kilitle**: Kimse giremez, sadece izin verdiklerin girer.\n` +
      `> **Gizle**: Oda listede görünmez, tam mahremiyet.\n\n` +
      `## ${CUSTOM_EMOJIS.uye} Üye Yönetimi\n` +
      `- İzin verilenler: en fazla 3 kişi ekle, kapılar onlara açılır.\n` +
      `- Yasaklılar: en fazla 3 kişi, hem engel hem ayak bağı kesilir.\n` +
      `- ${CUSTOM_EMOJIS.beyaztac} Sahiplik devri: odandan birine taçı devret.\n\n` +
      `## ${CUSTOM_EMOJIS.ninja} Otomatik Temizlik\n` +
      `Sahibi ayrılırsa taç **otomatik** içeridekilere geçer.\n` +
      `Kimse kalmazsa oda **45 saniye** sonra silinir.\n\n` +
      `## ${CUSTOM_EMOJIS.durum} Ekstra\n` +
      `- Kişi sınırı: 0 ile 99 arası (0 = sınırsız)\n` +
      `- İsim değiştir: istediğin ismi ver, karakterler otomatik temizlenir`
    )
  );

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# Bu paneli sadece oda sahibi kullanabilir • NOVA ${CUSTOM_EMOJIS.mor}`)
  );

  return container;
}

function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${d}g ${h}s ${m}dk ${s}sn`;
}

function buildStatsCard(data) {
  const container = new ContainerBuilder().setAccentColor(COLORS.yellow);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${CUSTOM_EMOJIS.durum} NOVA İstatistikleri\n-# Rakamlar yalan söylemez!`
    )
  );

  container.addSeparatorComponents(separator());

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> ${CUSTOM_EMOJIS.wumpus} **Aktif Oda:** \`${data.activeRooms}\`\n` +
      `> ${CUSTOM_EMOJIS.logo} **Toplam Kurulan Oda:** \`${data.totalRooms}\`\n` +
      `> ${CUSTOM_EMOJIS.england} **Sunucu Sayısı:** \`${data.guildCount}\`\n` +
      `> ${CUSTOM_EMOJIS.kartal} **Ping:** \`${data.ping} ms\`\n` +
      `> ${CUSTOM_EMOJIS.dans} **Çalışma Süresi:** \`${formatUptime(data.uptimeMs)}\`\n` +
      `> ${CUSTOM_EMOJIS.kelebek} **discord.js:** \`v${data.version}\``
    )
  );

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(BRAND_FOOTER));

  return container;
}

function buildRoomCreatedCard(channelId, ownerId) {
  const container = new ContainerBuilder().setAccentColor(COLORS.green);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${CUSTOM_EMOJIS.onay} Odan Hazır!\n-# ${CUSTOM_EMOJIS.dansedenkedi} Keyifli sohbetler!`
        )
      )
      .setThumbnailAccessory(thumbnail(null, "Hazır"))
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> ${CUSTOM_EMOJIS.cilekkedi} **Odanın:** <#${channelId}>\n` +
      `> ${CUSTOM_EMOJIS.beyaztac} **Sahibi:** <@${ownerId}>\n\n` +
      `Aşağıdaki kontrol merkezini kullanarak odanı dilediğin gibi şekillendir!`
    )
  );

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(BRAND_FOOTER));

  return container;
}

function buildSetupSuccessCard(categoryId, jtcChannelId) {
  const container = new ContainerBuilder().setAccentColor(COLORS.green);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${CUSTOM_EMOJIS.onay} Kurulum Tamamlandı!\n-# ${CUSTOM_EMOJIS.hihi} Sistem hazır, sinyal mükemmel!`
    )
  );

  container.addSeparatorComponents(separator());

  const lines = [
    `> ${CUSTOM_EMOJIS.kurdele} **Kategori:** <#${categoryId}>`,
    jtcChannelId
      ? `> ${CUSTOM_EMOJIS.logo} **Giriş Odası (Join-to-Create):** <#${jtcChannelId}> aktif!`
      : `> ${CUSTOM_EMOJIS.logo} **Giriş Odası:** ayarlanmadı — panel üzerinden **Oda Kur** ile oda kurulur.`
  ];

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(BRAND_FOOTER));

  return container;
}

function buildControlPanel(room) {
  const accent = room.locked ? COLORS.red : room.hidden ? COLORS.dark : COLORS.blurple;
  const container = new ContainerBuilder().setAccentColor(accent);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${CUSTOM_EMOJIS.siyahonay} Oda Kontrol Merkezi\n-# <#${room.channelId}>`
        )
      )
      .setThumbnailAccessory(thumbnail(room.iconUrl, "Sunucu"))
  );

  const members = (room.memberIds || []).slice(0, 12);
  const memberLine = members.length
    ? members.map((id) => `<@${id}>`).join(", ")
    : "*Oda boş*";
  const limitText = room.userLimit > 0 ? `\`${room.userLimit}\` kişi` : "`Sınırsız ∞`";

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> ${CUSTOM_EMOJIS.sahip} **Sahip:** <@${room.ownerId}>\n` +
      `> ${CUSTOM_EMOJIS.durum} **Durum:** ${room.locked ? `${CUSTOM_EMOJIS.nazar} Kilitli` : `${CUSTOM_EMOJIS.gokyuzuonay} Açık`} • ${room.hidden ? `${CUSTOM_EMOJIS.hayalet} Gizli` : `${CUSTOM_EMOJIS.onay} Görünür`}\n` +
      `> ${CUSTOM_EMOJIS.uye} **Limit:** ${limitText}\n` +
      `> ${CUSTOM_EMOJIS.kurdele} **Kuruluş:** <t:${Math.floor(room.createdAt / 1000)}:R>\n` +
      `> ${CUSTOM_EMOJIS.bebimonarch} **Odada:** ${memberLine}`
    )
  );

  container.addSeparatorComponents(separator());

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      button(
        "nova:lock",
        room.locked ? "Kilidi Aç" : "Kilitle",
        room.locked ? CUSTOM_EMOJIS.gokyuzuonay : CUSTOM_EMOJIS.nazar,
        ButtonStyle.Secondary
      ),
      button(
        "nova:ghost",
        room.hidden ? "Göster" : "Gizle",
        room.hidden ? CUSTOM_EMOJIS.onay : CUSTOM_EMOJIS.hayalet,
        ButtonStyle.Secondary
      ),
      button("nova:delete", "Sil", CUSTOM_EMOJIS.iptal, ButtonStyle.Danger)
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      button("nova:limit", "Kişi Sınırı", CUSTOM_EMOJIS.uye, ButtonStyle.Secondary),
      button("nova:rename", "İsmini Değiştir", CUSTOM_EMOJIS.dansedenkedi, ButtonStyle.Secondary),
      button("nova:claim", "Sahiplen", CUSTOM_EMOJIS.beyaztac, ButtonStyle.Success),
      button("nova:details", "Detaylar", CUSTOM_EMOJIS.kartal, ButtonStyle.Secondary)
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId("nova:allow")
        .setPlaceholder("➕ İzin verilecek üyeler")
        .setMinValues(1)
        .setMaxValues(3)
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId("nova:deny")
        .setPlaceholder("🚫 Yasaklanacak üyeler")
        .setMinValues(1)
        .setMaxValues(3)
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId("nova:transfer")
        .setPlaceholder("👑 Sahipliği devret (odadaki biri)")
        .setMinValues(1)
        .setMaxValues(1)
    )
  );

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# Bu paneli sadece oda sahibi kullanabilir • NOVA ${CUSTOM_EMOJIS.mor}`)
  );

  return container;
}

function buildErrorCard(reason) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${CUSTOM_EMOJIS.iptal} İşlem Başarısız\n${reason}`)
  );

  return container;
}

function buildWarningAlreadyOwned(channelId) {
  const container = new ContainerBuilder().setAccentColor(COLORS.yellow);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ${CUSTOM_EMOJIS.nazar} Zaten Bir Odan Var!\n` +
      `${CUSTOM_EMOJIS.kusdans} Seni mevcut odana taşıyorum: <#${channelId}>\n` +
      `-# Aynı anda birden fazla oda sahibi olamazsın!`
    )
  );

  return container;
}

function buildDetailsCard(room) {
  const container = new ContainerBuilder().setAccentColor(COLORS.blurple);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${CUSTOM_EMOJIS.kartal} Oda Detayları\n-# <#${room.channelId}>`
    )
  );

  container.addSeparatorComponents(separator());

  const memberCount = (room.memberIds || []).length;
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> ${CUSTOM_EMOJIS.kelebek} **İsim:** ${room.name}\n` +
      `> ${CUSTOM_EMOJIS.sahip} **Sahip:** <@${room.ownerId}>\n` +
      `> ${CUSTOM_EMOJIS.kurdele} **Kuruluş:** <t:${Math.floor(room.createdAt / 1000)}:f>\n` +
      `> ${CUSTOM_EMOJIS.nazar} **Kilit:** ${room.locked ? "Evet" : "Hayır"}\n` +
      `> ${CUSTOM_EMOJIS.hayalet} **Gizli:** ${room.hidden ? "Evet" : "Hayır"}\n` +
      `> ${CUSTOM_EMOJIS.uye} **Limit:** ${room.userLimit > 0 ? `${room.userLimit} kişi` : "Sınırsız ∞"}\n` +
      `> ${CUSTOM_EMOJIS.bebimonarch} **Şu an içeride:** ${memberCount} kişi`
    )
  );

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(BRAND_FOOTER));

  return container;
}

function buildEmojiListPage(pageTags, page, totalPages, totalCount) {
  const container = new ContainerBuilder().setAccentColor(COLORS.blurple);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${CUSTOM_EMOJIS.cute} Sunucu Emojileri\n-# Toplam **${totalCount}** emoji • Sayfa ${page + 1}/${totalPages}`
    )
  );

  container.addSeparatorComponents(separator());

  const body = pageTags.length > 0 ? pageTags.join("\n") : `${CUSTOM_EMOJIS.uyku} *Sunucuda emoji yok*`;
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  if (totalPages > 1) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`nova:emoji:${page - 1}`)
          .setLabel("Önceki")
          .setEmoji(CUSTOM_EMOJIS.gojo)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page <= 0),
        new ButtonBuilder()
          .setCustomId(`nova:emoji:${page + 1}`)
          .setLabel("Sonraki")
          .setEmoji(CUSTOM_EMOJIS.gezi)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages - 1)
      )
    );
  }

  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Ham formatları kopyalayıp istediğin yerde kullan • NOVA ${CUSTOM_EMOJIS.mor}`
    )
  );

  return container;
}

function buildNoticeCard(title, body) {
  const container = new ContainerBuilder().setAccentColor(COLORS.green);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${CUSTOM_EMOJIS.onay} ${title}\n${body}`)
  );

  return container;
}

function buildLimitModal() {
  const modal = new ModalBuilder()
    .setCustomId("nova-modal-limit")
    .setTitle("Kişi Sınırı");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("limit-input")
        .setLabel("Kişi sayısı (0 = sınırsız)")
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(2)
        .setRequired(true)
    )
  );

  return modal;
}

function buildRenameModal(currentName) {
  const modal = new ModalBuilder()
    .setCustomId("nova-modal-rename")
    .setTitle("Oda İsmini Değiştir");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("rename-input")
        .setLabel("Yeni oda adı (max 30 karakter)")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(30)
        .setValue((currentName || "").replace(/[/\\:*?"<>|]/g, "").slice(0, 90))
        .setRequired(true)
    )
  );

  return modal;
}

module.exports = {
  FALLBACK_AVATAR,
  payload,
  buildMainPanel,
  buildGuide,
  buildStatsCard,
  buildRoomCreatedCard,
  buildSetupSuccessCard,
  buildControlPanel,
  buildErrorCard,
  buildNoticeCard,
  buildWarningAlreadyOwned,
  buildDetailsCard,
  buildEmojiListPage,
  buildLimitModal,
  buildRenameModal,
  INVITE_PERMISSIONS
};
