const mongoose = require("mongoose");

const commandsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

const Command = mongoose.model("Command", commandsSchema);

module.exports = Command;
