const mongoose = require("mongoose");
const moment = require("moment");

const serverSchema = new mongoose.Schema({
  guild: {
    type: Number,
    required: true,
    unique: true,
  },
  prefix: {
    type: String,
    default: "y!",
  },
  LineLink: {
    type: String,
    default: "",
  },
  AutoLineChannels: {
    type: Array,
    default: [],
  },
  joinedAt: {
    type: String,
    default: () => moment().format("MMMM Do YYYY, h:mm:ss a"),
  },
});

const Server = mongoose.model("Server", serverSchema);

module.exports = Server;
