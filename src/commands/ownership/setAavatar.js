const Server = require("../../../utils/models/server");
const { messageSentReply } = require("../../../utils/handler/errorHandle");

module.exports = {
  dataCommand: {
    name: "set-avatar",
    perms: { ownership: true },
    description: "change a bot avatar",
    coolDown: 5,
    run: async (client, message, args) => {
      let newAvatar;
      if (message.attachments.size > 0) {
        newAvatar = message.attachments.first().url;
      } else if (args.length > 0) {
        newAvatar = args.join(" ");
      }
      const linkRegex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(\w+\.\w+)/;
      if (!newAvatar || !linkRegex.test(newAvatar)) {
        return messageSentReply(message, {
          content: `Please provide a valid link for the new avatar or attach an image.`,
        });
      }

      try {
        await client.user.setAvatar(newAvatar);
        await messageSentReply(message, {
          content: `Done Change Avatar: ${newAvatar}`,
        });
      } catch (err) {
        await messageSentReply(message, {
          content: `Error Changing Avatar. Please Try Again Later.`,
        });
      }
    },
  },
};
