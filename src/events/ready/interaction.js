const { Events, PermissionFlagsBits } = require("discord.js");
const BlackList = require("../../../utils/models/blacklist");
const DevId = process.env.DevId;
const { messageSentReply } = require("../../../utils/handler/errorHandle");
const coolDowns = new Map();

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    const userAuthor = interaction.guild.members.cache.get(
      interaction.member.id
    );
    const bot = interaction.guild.members.cache.get(client.user.id);
    const isOwner = interaction.guild.ownerId === userAuthor.id;

    let BlackListData;
    try {
      BlackListData = await BlackList.findOne({ id: userAuthor.id });
    } catch (err) {
      return messageSentReply(interaction, {
        content: `Error fetching blacklist data: \`\`\`${err}\`\`\``,
        ephemeral: true,
      });
    }

    const permissions = command.perms || {
      member: "",
      bot: "",
      roles: [],
      ownership: false,
    };

    const userHasPerms = permissions.member
      ? userAuthor.permissions.has(permissions.member)
      : true;
    const userIsAdmin = userAuthor.permissions.has(
      PermissionFlagsBits.Administrator
    );
    const botHasPerms = permissions.bot
      ? bot.permissions.has(permissions.bot)
      : true;
    const botIsAdmin = bot.permissions.has(PermissionFlagsBits.Administrator);
    const isDev = DevId.includes(userAuthor.id);

    const currentTime = Date.now();
    const commandCoolDown = command.coolDown || 1;
    const userCoolDownKey = `${userAuthor?.id}-${command}`;
    const lastUsed = coolDowns.get(userCoolDownKey);

    if (lastUsed && currentTime - lastUsed < commandCoolDown * 1000) {
      const timeLeft = Math.ceil(
        (commandCoolDown * 1000 - (currentTime - lastUsed)) / 1000
      );
      return messageSentReply(interaction, {
        content: `❌ | Please wait ${timeLeft} more second(s) before using this command again.`,
        ephemeral: true,
      });
    }

    coolDowns.set(userCoolDownKey, currentTime);

    if (command.blacklist && BlackListData && !isDev) {
      return messageSentReply(interaction, {
        content: `❌ | you are blacklisted`,
        ephemeral: true,
      });
    }

    if (!botHasPerms && !botIsAdmin) {
      return messageSentReply(interaction, {
        content: `❌ | I don't have permission \`${permissions.bot}\``,
        ephemeral: true,
      });
    }

    if (permissions.ownership && !isOwner && !isDev) {
      return messageSentReply(interaction, {
        content: `❌ | this command can only be used by the owner or developers`,
        ephemeral: true,
      });
    }

    if (!userHasPerms && !userIsAdmin && !isDev) {
      return messageSentReply(interaction, {
        content: `❌ | you don't have permission \`${permissions.member}\``,
        ephemeral: true,
      });
    }

    if (
      permissions.roles &&
      !permissions.roles.some((roleId) => userAuthor.roles.cache.has(roleId)) &&
      !userIsAdmin &&
      !isDev
    ) {
      return messageSentReply(interaction, {
        content: `❌ | you don't have permission`,
        ephemeral: true,
      });
    }

    if (command.perms === "dev" && !isDev) {
      return messageSentReply(interaction, {
        content: `❌ | this command can only be used by developers`,
        ephemeral: true,
      });
    }
    if (command.perms === "public") {
      // line
    }

    try {
      await command.run(client, interaction, userAuthor);
    } catch (error) {
      messageSentReply(interaction, {
        content: `There was an error executing that command!`,
        ephemeral: true,
      });
    }
  },
};
