import {
  Client,
  GatewayIntentBits,
  Events,
  type ChatInputCommandInteraction,
} from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) { console.error("❌ DISCORD_BOT_TOKEN missing"); process.exit(1); }

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`[Bot] Online: ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction as ChatInputCommandInteraction;

  if (cmd.commandName === "ping") {
    const latency = Date.now() - cmd.createdTimestamp;
    await cmd.reply(`🏓 Pong! Latensi: **${latency}ms** | WS: **${client.ws.ping}ms**`);
  } else if (cmd.commandName === "hello") {
    await cmd.reply(`👋 Halo, **${cmd.user.displayName}**!`);
  } else if (cmd.commandName === "info") {
    await cmd.reply(`ℹ️ Bot Tag: \`${client.user?.tag}\` | discord.js v14`);
  }
});

client.login(token);
