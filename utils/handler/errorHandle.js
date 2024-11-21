async function messageSentReply(chMessage, options) {
  try {
    const sentMessage = await chMessage.reply(options);
    return sentMessage;
  } catch (err) {
    try {
      const sentMessage = await chMessage.send(options);
      return sentMessage;
    } catch (err) {
      console.error(err);
    }
  }
}
async function messageSent(chMessage, options) {
  try {
    const sentMessage = await chMessage.send(options);
    return sentMessage;
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  messageSent,
  messageSentReply,
};
