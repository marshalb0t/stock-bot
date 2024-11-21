const { Events, PermissionFlagsBits } = require("discord.js");
const ServerInfo = require("../../../utils/models/server");
const BlackList = require("../../../utils/models/blacklist");
const { messageSentReply } = require("../../../utils/handler/errorHandle");
const DevId = process.env.DevId;
const coolDowns = new Map();

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;
    const serverId = message.guild.id;
    let prefixData;
    try {
      prefixData = await ServerInfo.findOne({ guild: serverId });
    } catch (error) {
      return messageSentReply(message, {
        content: `Error fetching prefix: \`\`\`${error}\`\`\``,
      });
    }

    const PREFIX = prefixData ? prefixData.prefix : "y!";

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) return;

    const userAuthor = await message.guild.members.cache.get(message.author.id);
    const bot = await message.guild.members.fetch(client.user.id);
    const isOwner = message.guild.ownerId === userAuthor.id;

    let BlackListData;
    try {
      BlackListData = await BlackList.findOne({ id: userAuthor.id });
    } catch (err) {
      return messageSentReply(message, {
        content: `Error fetching blacklist data : \`\`\`${err}\`\`\``,
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
    const userCoolDownKey = `${message.author?.id}-${commandName}`;
    const lastUsed = coolDowns.get(userCoolDownKey);

    if (lastUsed && currentTime - lastUsed < commandCoolDown * 1000) {
      const timeLeft = Math.ceil(
        (commandCoolDown * 1000 - (currentTime - lastUsed)) / 1000
      );
      return messageSentReply(message, {
        content: `❌ | Please wait ${timeLeft} more second(s) before using this command again.`,
      });
    }

    coolDowns.set(userCoolDownKey, currentTime);

    if (command.blacklist && BlackListData && !isDev) {
      return messageSentReply(message, {
        content: `❌ | you are blacklisted`,
      });
    }

    if (!botHasPerms && !botIsAdmin) {
      return messageSentReply(message, {
        content: `❌ | I don't have permission \`${permissions.bot}\``,
      });
    }

    if (permissions.ownership && !isOwner && !isDev) {
      return messageSentReply(message, {
        content: `❌ | this command can only be used by the owner or developers`,
      });
    }

    if (!userHasPerms && !userIsAdmin && !isDev) {
      return messageSentReply(message, {
        content: `❌ | you don't have permission \`${permissions.member}\``,
      });
    }

    if (permissions.roles) {
      if (
        !permissions.roles.some((roleId) =>
          userAuthor.roles.cache.has(roleId)
        ) &&
        !userIsAdmin &&
        !isDev
      ) {
        return messageSentReply(message, {
          content: `❌ | you don't have permission`,
        });
      }
    }

    if (command.perms === "dev" && !isDev) {
      return messageSentReply(message, {
        content: `❌ | this command can only be used by developers`,
      });
    }

    if (command.perms === "public") {
      // line
    }

    let mentionedUsers = Array.from(message.mentions.users.values());
    if (message.mentions.repliedUser) {
      mentionedUsers = mentionedUsers.filter(
        (user) => user.id !== message.mentions.repliedUser.id
      );
    }
    const user1Id = args[0];
    const user2Id = args[1];
    let userMention1 =
      mentionedUsers[0] ||
      (user1Id && (await message.guild.members.cache.get(user1Id))) ||
      null;

    let userMention2 =
      mentionedUsers[1] ||
      (user2Id && (await message.guild.members.cache.get(user2Id))) ||
      null;

      const user = userMention1 ? await message.guild.members.cache.get(userMention1.id) : null;
      const user1 = userMention2 ? await message.guild.members.cache.get(userMention2.id) : null;

    try {
      await command.run(client, message, args, userAuthor, user, user1);
    } catch (error) {
      console.log(error)
      messageSentReply(message, {
        content: `There was an error executing that command! \n\`\`\`${error}\`\`\``,
      });
    }
  },
};
