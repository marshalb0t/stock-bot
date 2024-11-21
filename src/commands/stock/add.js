const StockSchema = require("../../../utils/models/stock");
const {
  messageSentReply,
  messageSent,
} = require("../../../utils/handler/errorHandle");
const { EmbedBuilder } = require("@discordjs/builders");
const { addStockChannelId, stockRoles } = require("../../../config");
module.exports = {
  dataSlash: {
    name: `add_stock`,
    perms: { roles: stockRoles },
    description: "add stock for bot",
    coolDown: 5,
    options: [
      {
        name: "product_name",
        description: "type a product name",
        type: 3,
        required: true,
      },
      {
        name: "probot_price",
        description: "type a probot price",
        type: 3,
        required: true,
      },
      {
        name: "lunabot_price",
        description: "type a luna bot price",
        type: 3,
        required: true,
      },
      {
        name: "items",
        description: "item1 item2 item3 item4",
        type: 3,
        required: true,
      },
    ],
    run: async (client, interaction, userAuthor) => {
      const options = interaction.options;
      const productName = options.get("product_name").value;
      const probotPrice = options.get("probot_price").value;
      const lunaBotPrice = options.get("lunabot_price").value;
      const items = options.get("items").value.split(" ");
      const logChannel =
        interaction.guild.channels.cache.get(addStockChannelId);

      if (isNaN(probotPrice) && isNaN(lunaBotPrice)) {
        return messageSentReply(interaction, {
          content: `probot price and luna bot price must be a number`,
          ephemeral: true,
        });
      }
      const updateEmbed = new EmbedBuilder()
        .setTitle("Stock Updated")
        .setDescription(
          `Item Details \n` +
            `Item Name : \`${productName}\` \n` +
            `Item Price :\nProBot: \`${probotPrice}\`\nLunaBot : \`${lunaBotPrice}\``
        )
        .setTimestamp()
        .setFooter({
          text: `Update item details`,
        });
      const newEmbed = new EmbedBuilder()
        .setTitle("Stock New")
        .setDescription(
          `Item Details \n` +
            `Item Name : \`${productName}\` \n` +
            `Item Price :\nProBot: \`${probotPrice}\`\nLunaBot : \`${lunaBotPrice}\``
        )
        .setTimestamp()
        .setFooter({
          text: `New item details`,
        });
      const stockData = await StockSchema.findOne({ productName: productName });
      if (stockData) {
        const existingItems = stockData.items;
        const updatedItems = [...new Set([...existingItems, ...items])];
        stockData.quantity = updatedItems.length;

        stockData.probotPrice = probotPrice;
        stockData.lunaBotPrice = lunaBotPrice;
        stockData.items = updatedItems;
        await stockData.save();
        messageSentReply(interaction, {
          embeds: [updateEmbed],
          ephemeral: true,
        });
        messageSent(logChannel, {
          embeds: [updateEmbed],
        });
      } else {
        const newStock = new StockSchema({
          productName: productName,
          quantity: items.length,
          probotPrice: probotPrice,
          lunaBotPrice: lunaBotPrice,
          items: items,
        });
        await newStock.save();
        messageSentReply(interaction, {
          embeds: [newEmbed],
          ephemeral: true,
        });
        messageSent(logChannel, {
          embeds: [newEmbed],
        });
      }
    },
  },
};
