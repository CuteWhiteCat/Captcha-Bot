const { model, Schema } = require("mongoose");

module.exports = model("CaptchaSys", new Schema({
    GuildID: String,
    ChannelID: String,
    NoneRoleID: String,
    VerifiedRoleID: String,
}));