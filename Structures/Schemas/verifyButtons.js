const { model, Schema } = require("mongoose");

module.exports = model("CaptchaButtons", new Schema({
    GuildID: String,
    MsgID: String,
    UserID: String,
    Used: Number,
}));