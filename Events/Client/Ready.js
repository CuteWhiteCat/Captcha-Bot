const { Client } = require("discord.js");
const { Database } = require("../../Structures/config.json");
const mongoose = require("mongoose");
module.exports = {
    name: "ready",
    once: true,

    /**
    * @param {Client} client
    */

    async execute(client) {
        client.user.setPresence({ activities: [{ name: "Discord 認證機器人 | 作者 : 白貓" }], status: "dnd" })

        if (!Database) return;
        mongoose.connect(Database, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(() => {
            console.log("機器人已連上資料庫")
        }).catch((err) => {
            console.log(err)
        });
    }
}
