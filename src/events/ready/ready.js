const {
  Events,
  REST,
  Routes,
  ActivityType,
  WebhookClient,
} = require("discord.js");
const ServerInfo = require("../../../utils/models/server");
const { status } = require("../../../config");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const commands = Array.from(client.slashCommands.values()).map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options || [],
      type: cmd.type || 1,
    }));

    const rest = new REST({ version: "10" }).setToken(process.env.token);
    try {
      console.log("Started refreshing application (/) commands.");
      const response = await rest.put(
        Routes.applicationCommands(process.env.clientId),
        {
          body: commands,
        }
      );
      console.log("Successfully reloaded application (/) commands:", response);
    } catch (error) {
      console.error("Error refreshing application commands:", error);
    }

    console.log(`Logged To : ${client.user.username}`);
    console.log(`Bot Id : ${client.user.id}`);
    const activityMap = {
      Custom: ActivityType.Custom,
      Competing: ActivityType.Competing,
      Listening: ActivityType.Listening,
      Playing: ActivityType.Playing,
      Streaming: ActivityType.Streaming,
      Watching: ActivityType.Watching,
    };
    const activities = status.text.map((text) => ({
      type: activityMap[status.activity] || ActivityType.Playing,
      name: text,
    }));

    let activityIndex = 0;

    setInterval(() => {
      const currentActivity = activities[activityIndex];
      client.user.setPresence({
        activities: [currentActivity],
        status: "online",
      });

      activityIndex = (activityIndex + 1) % activities.length;
    }, 5000);


    await Promise.all(
      client.guilds.cache.map(async (guild) => {
        const serverId = guild.id;
        let server = await ServerInfo.findOne({ guild: serverId });
        if (!server) {
          server = new ServerInfo({ guild: serverId });
          await server.save();
        }
      })
    );
  },
};
