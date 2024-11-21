const StockSchema = require("../../../utils/models/stock");
const {
  messageSentReply,
  messageSent,
} = require("../../../utils/handler/errorHandle");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} = require("@discordjs/builders");
const { ButtonStyle, AttachmentBuilder } = require("discord.js");
const { bankId, buyProfChannel } = require("../../../config");
const LutexBits = require("lutex-bits-transfer");

let activePurchases = {};

module.exports = {
  dataCommand: {
    name: "buy",
    perms: "public",
    description: "buy itemName",
    blacklist: true,
    coolDown: 5,
    run: async (client, message, args, messageAuthor) => {
      const itemName = args[0];
      const item = await StockSchema.findOne({ productName: itemName });

      if (!item) {
        const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription("Item not found");
        return messageSentReply(message, { embeds: [embed] });
      }

      if (activePurchases[itemName]) {
        return messageSentReply(message, {
          content: `Please wait for <@${activePurchases[itemName]}> to finish their purchase first.`,
        });
      }

      activePurchases[itemName] = message.author.id;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("probot")
          .setLabel("Pro Bot")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("lunabot")
          .setLabel("Luna Bot")
          .setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder().setTitle("What is your payment method?");
      const questionMessage = await messageSentReply(message, {
        embeds: [embed],
        components: [row],
      });

      const filter = (interaction) => interaction.user.id === message.author.id;
      const collector = questionMessage.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on("collect", async (interaction) => {
        const paymentMethod = interaction.customId;
        collector.stop();

        await interaction.update({
          content: `Please enter the quantity you want to buy. Available items: ${item.quantity}`,
          components: [],
        });

        const quantityFilter = (response) =>
          response.author.id === message.author.id;
        const quantityCollector = message.channel.createMessageCollector({
          filter: quantityFilter,
          time: 15000,
        });
        let quantityProcessed = false;
        let requestedQuantity;
        quantityCollector.on("collect", async (response) => {
          requestedQuantity = parseInt(response.content);

          if (isNaN(requestedQuantity)) {
            return messageSentReply(message, {
              content: "Please enter a valid number for the quantity.",
            });
          }

          if (requestedQuantity > item.quantity) {
            return messageSentReply(message, {
              content: `Sorry, only ${item.quantity} items are available.`,
            });
          }

          quantityProcessed = true;
          quantityCollector.stop();

          const summaryEmbed = new EmbedBuilder()
            .setTitle("Purchase Details")
            .setDescription(
              `You bought ${requestedQuantity} ${item.productName} using ${paymentMethod}.`
            );

          let totalPrice;
          if (paymentMethod === "probot") {
            totalPrice = requestedQuantity * item.probotPrice;
            const priceWithTax = Math.floor((totalPrice * 20) / 19 + 1);
            const commandEmbed = new EmbedBuilder()
              .setTitle("You have 30 seconds")
              .setDescription(`c ${bankId} ${priceWithTax}`)
              .setTimestamp();

            messageSentReply(message, { embeds: [summaryEmbed, commandEmbed] });

            const responseFilter = (response) =>
              response.author.id === "282859044593598464" &&
              response.content ===
                `**:moneybag: | ${message.author.tag}, has transferred \`$${totalPrice}\` to <@!${bankId}> **`;

            message.channel
              .awaitMessages({
                filter: responseFilter,
                max: 1,
                time: 30000,
                errors: ["time"],
              })
              .then(async () => {
                await completePurchase(
                  client,
                  message,
                  totalPrice,
                  requestedQuantity,
                  item
                );
              })
              .catch(async () => {
                await messageSentReply(message, {
                  content:
                    "**Time limit exceeded. Payment has been canceled.**",
                });
              });
          } else if (paymentMethod === "lunabot") {
            totalPrice = requestedQuantity * item.lunaBotPrice
            const lunaBitsEmbed = new EmbedBuilder()
              .setTitle("You have 30 seconds")
              .setDescription(
                `/bits user:${bankId} amount:${totalPrice}`
              )
              .setTimestamp();

            messageSentReply(message, {
              embeds: [summaryEmbed, lunaBitsEmbed],
            });

            const options = {
              botId: "1276522930653630556",
              BankID: `${bankId}`,
              amount: totalPrice,
              duration: 30000,
            };

            try {
              const transferSuccessful = await LutexBits(
                client,
                message.channel,
                options
              );
              if (transferSuccessful) {
                return await completePurchase(
                  client,
                  message,
                  totalPrice,
                  requestedQuantity,
                  item
                );
              } else {
                return await messageSentReply(message, {
                  content:
                    "**Time limit exceeded. Payment has been canceled.**",
                });
              }
            } catch (error) {
              await messageSentReply(message, {
                content: "**Time limit exceeded. Payment has been canceled.**",
              });
            }
          }

          delete activePurchases[itemName];
        });

        quantityCollector.on("end", (collected, reason) => {
          if (reason === "time") {
            messageSentReply(message, {
              content:
                "You didn't provide a quantity in time, purchase canceled.",
            });
            delete activePurchases[itemName];
          }
        });
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          messageSentReply(message, {
            content:
              "You didn't choose a payment method in time, purchase canceled.",
          });
          delete activePurchases[itemName];
        }
      });
    },
  },
};

async function completePurchase(client, message, price, quantity, item) {
  const remainingQuantity = item.quantity - quantity;

  const purchasedItems = item.items.slice(0, quantity);

  await StockSchema.updateOne(
    { productName: item.productName },
    { $set: { quantity: remainingQuantity } }
  );

  const updatedItems = item.items.slice(quantity);

  await StockSchema.updateOne(
    { productName: item.productName },
    { $set: { items: updatedItems } }
  );

  const embed = new EmbedBuilder()
    .setTitle("Purchase Complete")
    .setDescription(
      `Product Details \n` +
        `Item Name: ${item.productName}\n` +
        `Quantity: ${quantity}\n` +
        `Price : $${price}`
    )
    .setThumbnail(message.guild.iconURL({ size: 2048, dynamic: true }))
    .setTimestamp()
    .setFooter({
      text: `Purchase Complete`,
      iconURL: message.guild.iconURL({ size: 2048, dynamic: true }),
    });

  const fileContent = `Purchased items:\n${purchasedItems.join("\n")}`;
  const file = new AttachmentBuilder(Buffer.from(fileContent, "utf-8"), {
    name: "purchased_items.txt",
  });

  messageSent(message.author, {
    embeds: [embed],
    files: [file],
  });
  const profsChannel = message.guild.channels.cache.get(buyProfChannel);

  messageSent(profsChannel, {
    embeds: [embed],
  });
  messageSent(message.channel, {
    content: `**Purchase of \`${quantity}\` \`${item.productName}\` completed successfully! Remaining quantity: \`${remainingQuantity}\`.**`,
  });
}
