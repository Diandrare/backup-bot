# Discord Bots — Deploy Guide

Bot ini berisi dua bot Discord:
- **Bot 1** — Active Developer helper (`/ping`, `/hello`, `/info`)
- **Bot 2** — Server Backup bot (`/backup`, `/restore`, `/backuplist`)

---

## Deploy ke Railway (Gratis)

1. Buka [railway.app](https://railway.app) → login dengan GitHub
2. Klik **New Project** → **Deploy from GitHub repo**
3. Upload folder ini ke GitHub repo baru, lalu connect ke Railway
4. Di Railway, buka tab **Variables** dan tambahkan:
   ```
   DISCORD_BOT_TOKEN=...
   DISCORD_APPLICATION_ID=...
   DISCORD_BOT_TOKEN_2=...
   DISCORD_APPLICATION_ID_2=...
   ```
5. Railway otomatis deploy dan bot langsung online 24/7 🎉

---

## Deploy ke Render (Gratis)

1. Buka [render.com](https://render.com) → login dengan GitHub
2. Klik **New** → **Background Worker**
3. Connect GitHub repo yang berisi folder ini
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Tambahkan Environment Variables sama seperti di atas
7. Klik **Create Worker** — bot langsung online 24/7 🎉

---

## Jalankan Lokal

```bash
# Install dependencies
npm install

# Copy dan isi .env
cp .env.example .env

# Daftarkan slash commands (sekali saja)
npm run register

# Jalankan bot
npm start
```
