const { Message } = require("discord.js");
const DB = require("../../Structures/Schemas/CaptchaSys");

module.exports = {
    name: "messageCreate",

    /**
     * 
     * @param {Message} message 
     */

    async execute(message, client) {
        // 伺服器內
        if (!(message.inGuild())) return;

        // 訊息並非機器人發送
        if (message.author.bot) return;
        
        // Captcha System Channel
        const VGuild = await message.guildId;
        const Channel_Finder = await DB.findOne({ GuildID: VGuild });
        if (Channel_Finder) {
            const VChannel = await client.channels.cache.get(`${Channel_Finder.ChannelID}`);
            if (message.channel !== VChannel) return;

            if ((/\/verify/).test(message.content) != true) {
                message.delete();
            }
        };
    },
};