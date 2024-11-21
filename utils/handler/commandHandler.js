const fs = require("fs");
const path = require("path");
const Command = require("../models/commands");
async function loadCommands(client) {
  client.allCommands = [];

  const commandsDir = path.join(__dirname, "../../src/commands");

  await loadCommandsFromDirectory(client, commandsDir);
}

async function loadCommandsFromDirectory(client, dir) {
  const commandFiles = fs.readdirSync(dir);

  for (const file of commandFiles) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await loadCommandsFromDirectory(client, filePath);
    } else if (file.endsWith(".js")) {
      const command = require(filePath);

      if (command.dataCommand) {
        client.commands.set(command.dataCommand.name, command.dataCommand);
        client.allCommands.push({
          name: command.dataCommand.name,
          aliases: command.dataCommand.aliases || [],
          permission: command.dataCommand.perms || "None",
          type: "prefix",
        });

        const newCommand = await new Command({
          name: command.dataCommand.name,
          type: "prefix",
        });
        await newCommand.save();
      }

      if (command.dataSlash) {
        client.slashCommands.set(command.dataSlash.name, command.dataSlash);
        client.allCommands.push({
          name: command.dataSlash.name,
          permission: command.dataSlash.perms || "None",
          type: "slash",
        });

        const newCommand = await new Command({
          name: command.dataSlash.name,
          type: "slash",
        });
        await newCommand.save();
      }
    }
  }
}

module.exports = { loadCommands };
