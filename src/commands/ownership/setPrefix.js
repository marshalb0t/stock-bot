const Server = require("../../../utils/models/server");
const { messageSentReply } = require("../../../utils/handler/errorHandle");
module.exports = {
  dataCommand: {
    name: "set-prefix",
    perms: { ownership: true },
    description: "change a server prefix",
    coolDown: 5,
    run: async (client, message, args) => {
      const newPrefix = args[0];
      if (!newPrefix) {
        return messageSentReply(message, {
          content: `❌ | Please type new prefix`,
        });
      }
      const serverId = message.guild.id;
      try {
        let prefixData = await Server.findOne({ guild: serverId });
        if (prefixData) {
          prefixData.prefix = newPrefix;
          await prefixData.save();
          return messageSentReply(message, {
            content: `✔ | Done update you prefix to : ${newPrefix}`,
          });
        } else {
          prefixData = new Prefix({ guild: serverId, prefix: newPrefix });
          await prefixData.save();
          return messageSentReply(message, {
            content: `✔ | New Prefix Is : ${newPrefix}`,
          });
        }
      } catch (error) {
        return messageSentReply(message, {
          content: `❌ | Error save a new prefix`,
        });
      }
    },
  },
};
