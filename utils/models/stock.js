const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    unique: true
  },
  quantity: {
    type: String,
    required: true
  },
  probotPrice: {
    type: Number,
    required: true
  },
  lunaBotPrice: {
    type: Number,
    required: true
  },
  items: {
    type: Array,
    required: true
  }
});

const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;
