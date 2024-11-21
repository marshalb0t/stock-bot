const Server = require("../../../utils/models/server");
const { messageSentReply } = require("../../../utils/handler/errorHandle");

module.exports = {
  dataCommand: {
    name: "set-banner",
    perms: { ownership: true },
    description: "change a bot banner",
    coolDown: 5,
    run: async (client, message, args) => {
      let newBanner;
      if (message.attachments.size > 0) {
        newBanner = message.attachments.first().url;
      } else if (args.length > 0) {
        newBanner = args.join(" ");
      }
      const linkRegex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(\w+\.\w+)/;
      if (!newBanner || !linkRegex.test(newBanner)) {
        return messageSentReply(message, {
          content: `Please provide a valid link for the new banner or attach an image.`,
        });
      }

      try {
        await client.user.setBanner(newBanner);
        await messageSentReply(message, {
          content: `Done Change Banner: ${newBanner}`,
        });
      } catch (err) {
        await messageSentReply(message, {
          content: `Error Changing Banner. Please Try Again Later.`,
        });
      }
    },
  },
};
