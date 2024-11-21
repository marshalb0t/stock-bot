const StockSchema = require("../../../utils/models/stock");
const { messageSentReply } = require("../../../utils/handler/errorHandle");
const { EmbedBuilder } = require("@discordjs/builders");
const ServerSchema = require("../../../utils/models/server");
module.exports = {
  dataCommand: {
    name: "stock",
    perms: "public",
    description: "stock command",
    blacklist: true,
    coolDown: 3,
    run: async (client, message) => {
      const stockData = await StockSchema.find({});
      const ServerFind = await ServerSchema.findOne({
        guild: message.guild?.id,
      });
      if (stockData.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle("Stock")
          .setDescription("No stock available");
        return messageSentReply(message, {
          embeds: [embed],
        });
      }

      const chunkSize = 15;
      const chunkedData = [];

      for (let i = 0; i < stockData.length; i += chunkSize) {
        chunkedData.push(stockData.slice(i, i + chunkSize));
      }

      for (const [index, chunk] of chunkedData.entries()) {
        const embed = new EmbedBuilder().setTitle(
          `Stock (Page ${index + 1}/${chunkedData.length})`
        );

        const description = chunk
          .map(
            (item, i) =>
              `**Product Name \`:\` ${item.productName}**\n` +
              `**Quantity \`:\` ${item.quantity}**\n` +
              `**ProBot Price \`:\` $${item.probotPrice}**\n` +
              `**LunaBot Price \`:\` $${item.lunaBotPrice}**\`\n` +
              `to buy type: \n${ServerFind.prefix}buy ${item.productName}`
          )
          .join("\n\n");

        embed.setDescription(description);

        await messageSentReply(message, { embeds: [embed] });
      }
    },
  },
};
