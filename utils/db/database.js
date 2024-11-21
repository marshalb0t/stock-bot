const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://clever_mongodb:clever1999@cluster0.6e4mf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("MongoDB connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
