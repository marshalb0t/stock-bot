const BlacklistInfo = require("../../../utils/models/blacklist");
const { messageSentReply } = require("../../../utils/handler/errorHandle");
module.exports = {
  dataCommand: {
    name: "blc",
    perms: { ownership: true },
    description: "blacklist commands",
    coolDown: 5,
    run: async (client, message, args, userAuthor, userMention1) => {
      if (!userMention1) {
        return messageSentReply(message, {
          content: `❌ | not found user`,
        });
      }

      const blacklistData = await BlacklistInfo.findOne({
        id: userMention1.id,
      });
      if (!blacklistData) {
        const newBlacklist = new BlacklistInfo({ id: userMention1.id });
        try {
          await newBlacklist.save();
          return messageSentReply(message, {
            content: `✅ | User ${userMention1} added to blacklist.`,
          });
        } catch (error) {
          return messageSentReply(message, {
            content: `❌ | Error saving user to blacklist: ${error.message}`,
          });
        }
      } else {
        const deleteBlacklist = await BlacklistInfo.deleteOne({
          id: userMention1.id,
        });
        try {
          return messageSentReply(message, {
            content: `✅ | User ${userMention1} removed from blacklist.`,
          });
        } catch (error) {
          return messageSentReply(message, {
            content: `❌ | Error saving user to blacklist: ${error.message}`,
          });
        }
      }
    },
  },
};
