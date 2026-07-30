/**
 * Daftarkan slash commands untuk kedua bot
 * Jalankan sekali: npm run register
 */
import { REST, Routes } from "discord.js";

const token1 = process.env.DISCORD_BOT_TOKEN;
const clientId1 = process.env.DISCORD_APPLICATION_ID;
const token2 = process.env.DISCORD_BOT_TOKEN_2;
const clientId2 = process.env.DISCORD_APPLICATION_ID_2;

const rest = new REST({ version: "10" });

// Bot 1 — Active Developer bot
if (token1 && clientId1) {
  rest.setToken(token1);
  await rest.put(Routes.applicationCommands(clientId1), {
    body: [
      { name: "ping", description: "Cek latensi bot." },
      { name: "hello", description: "Bot menyapa kamu." },
      { name: "info", description: "Info tentang bot." },
    ],
  });
  console.log("✅ Bot 1 commands terdaftar (ping, hello, info)");
}

// Bot 2 — Backup bot
if (token2 && clientId2) {
  rest.setToken(token2);
  await rest.put(Routes.applicationCommands(clientId2), {
    body: [
      { name: "backup", description: "Backup struktur server." },
      { name: "restore", description: "Restore server dari backup terakhir." },
      { name: "backuplist", description: "Lihat daftar backup." },
    ],
  });
  console.log("✅ Bot 2 commands terdaftar (backup, restore, backuplist)");
}
