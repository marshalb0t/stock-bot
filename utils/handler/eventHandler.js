const fs = require("fs");
const path = require("path");

function loadEvents(client) {
  const eventsDir = path.join(__dirname, "../../src/events");

  loadEventsFromDirectory(client, eventsDir);
}

function loadEventsFromDirectory(client, dir) {
  const eventFiles = fs.readdirSync(dir);

  for (const file of eventFiles) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      loadEventsFromDirectory(client, filePath);
    } else if (file.endsWith(".js")) {
      const event = require(filePath);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    }
  }
}

module.exports = { loadEvents };
