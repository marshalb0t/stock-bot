const { Events } = require("discord.js");
const ServerInfo = require("../../../utils/models/server");

module.exports = {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    const serverId = guild.id;

    try {
      let server = await ServerInfo.findOne({ guid: serverId });

      if (!server) {
        server = new ServerInfo({ guild: serverId });
        await server.save();
        console.log(`New server info saved for server: ${serverId}`);
      } else {
        console.log(`Server info already exists for server: ${serverId}`);
      }
    } catch (error) {
      console.error("Error saving server info:", error);
    }
  },
};
