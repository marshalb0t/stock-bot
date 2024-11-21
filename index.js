const {
  Client,
  GatewayIntentBits,
  Collection,
  WebhookClient,
} = require("discord.js");
require("dotenv").config();
(async () => {
  const client = new Client({
    intents: 131071,
  });
  client.setMaxListeners(70);

  const connectDB = require("./utils/db/database.js");
  await connectDB();
  client.commands = new Collection();
  client.coolDowns = new Collection();
  client.slashCommands = new Collection();

  client.allCommands = [];

  const { loadCommands } = require("./utils/handler/commandHandler");
  await loadCommands(client);

  const { loadEvents } = require("./utils/handler/eventHandler");
  loadEvents(client);

  client.login(process.env.token);

  // error handle all time
  const webhookIdPrivate = ""; //webhook id
  const webhookTokenPrivate = "";//webhook token

  const webhookPrivate = new WebhookClient({
    id: webhookIdPrivate,
    token: webhookTokenPrivate,
  });

  client.on(Events.ClientReady, (client) => {
    console.error = function (message) {
      const errorMessage =
        typeof message === "object"
          ? JSON.stringify(message, null, 2)
          : message;
      webhookPrivate.send(`Error: \`\`\`${errorMessage}\`\`\``);
    };

    console.log(`Logged in as ${client.user.tag}!`);
  });

  process.on("uncaughtException", (error) => {
    const errorMessage =
      typeof error === "object" ? JSON.stringify(error, null, 2) : error;
    webhookPrivate.send(`Uncaught Exception: \`\`\`${errorMessage}\`\`\``);
  });

  process.on("unhandledRejection", (reason) => {
    const reasonMessage =
      typeof reason === "object" ? JSON.stringify(reason, null, 2) : reason;
    webhookPrivate.send(`Unhandled Rejection: \`\`\`${reasonMessage}\`\`\``);
  });
})();
