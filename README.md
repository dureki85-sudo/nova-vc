# 🔊 NOVA — Özel Kanal Oluşturma Botu

Discord **Components V2** ile yazılmış, lüks görünümlü özel ses kanalı botu.
Kullanıcılar tek tıkla kendi ses odasını kurar; kilit, gizlilik, kişi sınırı,
izinler ve sahiplik devri tamamen panelden yönetilir. 💜

## ✨ Özellikler

- 🛠 Tek tıkla oda kurma (Join-to-Create desteği)
- 🔒 Kilitle / 👻 Gizle / 🗑 Sil butonları
- ⚙ Kişi sınırı (0–99) ve ✏ isim değiştirme modalları
- ➕ İzinli üyeler / 🚫 Yasaklı üyeler / 👑 Sahiplik devri seçim menüleri
- 🧹 Boş odalar 45 saniye sonra otomatik silinir
- 👑 Sahip ayrılırsa taç otomatik devredilir
- 💾 JSON kalıcılık (`data/db.json`) — restart sonrası paneller yaşar
- 📊 Canlı istatistik kartı (ping, uptime, oda sayıları)

## 📦 Kurulum

```bash
cd vc-bot
npm install
```

`.env.example` dosyasını `.env` olarak kopyala ve doldur:

```env
DISCORD_TOKEN=bot_tokenin_burada
GUILD_ID=test_sunucu_id  # opsiyonel ama önerilir
```

Token almak için: [Discord Developer Portal](https://discord.com/developers/applications)
→ New Application → Bot → Reset Token.
Bot yetkileri davet linki izin biti: `17894416`.

Davet linki şablonu:

```text
https://discord.com/oauth2/authorize?client_id=UYGULAMA_ID&scope=bot%20applications.commands&permissions=17894416
```

## ▶️ Çalıştırma

```bash
npm start
```

İlk adımlar:

1. Sunucunda `/vc panel` komutunu kullan → kurulum paneli gelir.
2. `/vc setup kategori:<kategori> giris_odasi:<ses kanalı>` ile sistemi bağla.
3. Paneldeki **🛠 Oda Kur** butonuna bas veya giriş odasına gir → odan hazır!

## 🧪 Kalite Testleri

```bash
npm run selftest   # Tüm Components V2 konteynerlerini login olmadan doğrular
node --check index.js
```

## 🚆 Railway ile Yayına Alma

### Yöntem A — GitHub Import (önerilen)

1. Bu klasörü bir GitHub reposuna pushla (örn. `nova-vc`).
2. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. `nova-vc` reposunu seç, Railway otomatik `NIXPACKS` builder ile kurar.
4. **Variables** sekmesine git → `DISCORD_TOKEN` değişkenini ekle
   (opsiyonel `GUILD_ID` de ekleyebilirsin).
5. Deploy bitince bot çevrimiçi olur. `restartPolicyType: ON_FAILURE`
   sayesinde çökme sonrası otomatik yeniden başlar.

### Yöntem B — Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway variables set DISCORD_TOKEN=bot_tokenin_burada
railway up
```

> ⚠️ Token asla dosyaya veya git'e yazılmaz; sadece `.env` (gitignore'lu)
> ve Railway environment değişkeni olarak tutulur.

## 🗂 Dosya Yapısı

```text
vc-bot/
├── index.js              # Giriş noktası: client, olaylar, otomasyon
├── railway.json          # Railway deploy yapılandırması
├── src/
│   ├── config.js         # Renk paleti, tema emojileri, süreler
│   ├── db.js             # JSON kalıcılık (data/db.json)
│   ├── ui.js             # TÜM Components V2 konteyner üreticileri
│   ├── vcManager.js      # Oda oluşturma/yönetim/otomatik temizlik
│   └── handlers.js       # Slash + buton + select + modal yönlendirme
└── scripts/selftest.js   # Login olmadan UI payload doğrulaması
```

---

-# NOVA © 2026 • Sunucunu boostlamayı unutma 💜
