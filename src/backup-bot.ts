import {
  Client,
  GatewayIntentBits,
  Events,
  PermissionFlagsBits,
  ChannelType,
  type Guild,
  type ChatInputCommandInteraction,
  type CategoryChannel,
  type TextChannel,
  type VoiceChannel,
  type Role,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";

const token = process.env.DISCORD_BOT_TOKEN_2;
if (!token) { console.error("❌ DISCORD_BOT_TOKEN_2 missing"); process.exit(1); }

const BACKUP_DIR = path.resolve("./backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

interface ChannelBackup {
  name: string; type: ChannelType; position: number;
  topic?: string | null; nsfw?: boolean; rateLimitPerUser?: number;
  parentName?: string | null;
  permissionOverwrites: { name: string; type: number; allow: string; deny: string }[];
}
interface RoleBackup {
  name: string; color: number; hoist: boolean;
  mentionable: boolean; permissions: string; position: number;
}
interface ServerBackup {
  guildId: string; guildName: string; timestamp: string;
  roles: RoleBackup[]; channels: ChannelBackup[];
}

const SUPPORTED_TYPES = new Set([
  ChannelType.GuildCategory, ChannelType.GuildText,
  ChannelType.GuildVoice, ChannelType.GuildAnnouncement,
]);

function backupServer(guild: Guild): ServerBackup {
  const roles: RoleBackup[] = guild.roles.cache
    .filter((r) => r.name !== "@everyone")
    .sort((a, b) => a.position - b.position)
    .map((r: Role) => ({
      name: r.name, color: r.color, hoist: r.hoist,
      mentionable: r.mentionable,
      permissions: r.permissions.bitfield.toString(), position: r.position,
    }));

  const channels: ChannelBackup[] = guild.channels.cache
    .filter((ch) => SUPPORTED_TYPES.has(ch.type))
    .sort((a, b) => (a as TextChannel).position - (b as TextChannel).position)
    .map((ch) => {
      const nonThread = ch as TextChannel | VoiceChannel | CategoryChannel;
      const overwrites = nonThread.permissionOverwrites.cache.map((ow) => ({
        name: ow.type === 0 ? guild.roles.cache.get(ow.id)?.name ?? ow.id : ow.id,
        type: ow.type, allow: ow.allow.bitfield.toString(), deny: ow.deny.bitfield.toString(),
      }));
      return {
        name: ch.name, type: ch.type, position: nonThread.position,
        topic: ch.type === ChannelType.GuildText ? (ch as TextChannel).topic : null,
        nsfw: ch.type === ChannelType.GuildText ? (ch as TextChannel).nsfw : false,
        rateLimitPerUser: ch.type === ChannelType.GuildText ? (ch as TextChannel).rateLimitPerUser : 0,
        parentName: ch.type !== ChannelType.GuildCategory ? (ch as TextChannel | VoiceChannel).parent?.name ?? null : null,
        permissionOverwrites: overwrites,
      };
    });

  return { guildId: guild.id, guildName: guild.name, timestamp: new Date().toISOString(), roles, channels };
}

async function restoreServer(guild: Guild, backup: ServerBackup): Promise<string[]> {
  const log: string[] = [];
  const existingRoleNames = new Set(guild.roles.cache.map((r) => r.name));

  for (const r of backup.roles) {
    if (existingRoleNames.has(r.name)) continue;
    try {
      await guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist, mentionable: r.mentionable, permissions: BigInt(r.permissions) });
      log.push(`✅ Role: ${r.name}`);
    } catch { log.push(`⚠️ Gagal role: ${r.name}`); }
  }

  await guild.roles.fetch();
  const existingChannelNames = new Set(guild.channels.cache.map((c) => c.name));

  for (const cat of backup.channels.filter((c) => c.type === ChannelType.GuildCategory)) {
    if (existingChannelNames.has(cat.name)) continue;
    try {
      await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory, position: cat.position });
      log.push(`✅ Kategori: ${cat.name}`);
    } catch { log.push(`⚠️ Gagal kategori: ${cat.name}`); }
  }

  await guild.channels.fetch();

  for (const ch of backup.channels.filter((c) => c.type !== ChannelType.GuildCategory)) {
    if (existingChannelNames.has(ch.name)) continue;
    const parent = ch.parentName
      ? (guild.channels.cache.find((c) => c.name === ch.parentName && c.type === ChannelType.GuildCategory) as CategoryChannel | undefined)
      : undefined;
    try {
      if (ch.type === ChannelType.GuildText) {
        await guild.channels.create({ name: ch.name, type: ChannelType.GuildText, parent: parent?.id, topic: ch.topic ?? undefined, nsfw: ch.nsfw, rateLimitPerUser: ch.rateLimitPerUser, position: ch.position });
      } else if (ch.type === ChannelType.GuildVoice) {
        await guild.channels.create({ name: ch.name, type: ChannelType.GuildVoice, parent: parent?.id, position: ch.position });
      }
      log.push(`✅ Channel: #${ch.name}`);
    } catch { log.push(`⚠️ Gagal channel: #${ch.name}`); }
  }
  return log;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`[Backup Bot] Online: ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction as ChatInputCommandInteraction;
  const guild = cmd.guild;
  if (!guild) { await cmd.reply({ content: "❌ Server only.", ephemeral: true }); return; }

  const member = await guild.members.fetch(cmd.user.id);
  if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
    await cmd.reply({ content: "❌ Butuh permission **Administrator**.", ephemeral: true }); return;
  }

  if (cmd.commandName === "backup") {
    await cmd.deferReply();
    const backup = backupServer(guild);
    const filename = `${guild.id}_${Date.now()}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, filename), JSON.stringify(backup, null, 2));
    await cmd.editReply(`✅ **Backup berhasil!**\n> Roles: **${backup.roles.length}** | Channels: **${backup.channels.length}**\n> File: \`${filename}\``);
  } else if (cmd.commandName === "backuplist") {
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith(guild.id) && f.endsWith(".json")).sort().reverse();
    if (!files.length) { await cmd.reply({ content: "📂 Belum ada backup.", ephemeral: true }); return; }
    const list = files.slice(0, 10).map((f, i) => `${i + 1}. \`${f}\` — <t:${Math.floor(parseInt(f.split("_")[1]) / 1000)}:R>`);
    await cmd.reply({ content: `📋 **Backup List**\n${list.join("\n")}`, ephemeral: true });
  } else if (cmd.commandName === "restore") {
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith(guild.id) && f.endsWith(".json")).sort().reverse();
    if (!files.length) { await cmd.reply({ content: "❌ Belum ada backup.", ephemeral: true }); return; }
    await cmd.deferReply();
    const backup: ServerBackup = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, files[0]), "utf-8"));
    const logs = await restoreServer(guild, backup);
    const created = logs.filter((l) => l.startsWith("✅")).length;
    await cmd.editReply(`🔄 **Restore Selesai!**\n> Dibuat ulang: **${created}** | File: \`${files[0]}\`\n\n${logs.slice(0, 10).join("\n")}`);
  }
});

client.login(token);
