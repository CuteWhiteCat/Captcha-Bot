const { CommandInteraction, MessageEmbed } = require("discord.js");
const DB = require("../../Structures/Schemas/CaptchaSys");

module.exports = {
    name: "captcha-setup",
    description: "設定Captcha系統",
    options: [
        {
            name: "channel",
            description: "設定認證頻道",
            type: "CHANNEL",
            channelTypes: ["GUILD_TEXT"],
            required: true,
        },
        {
            name: "default-role",
            description: "設定未認證身分組",
            type: "ROLE",
            required: true,
        },
        {
            name: "verified-role",
            description: "設定認證身分組",
            type: "ROLE",
            required: true,
        },
    ],

    /**
     * 
     * @param {CommandInteraction} interaction 
     */

    async execute(interaction) {
        const { guild, options } = interaction;
        const Channel = options.getChannel("channel");
        const DefaultRole = options.getRole("default-role");
        const VerifiedRole = options.getRole("verified-role");

        await DB.findOneAndUpdate(
            { GuildID: guild.id },
            {
                GuildID: guild.id,
                ChannelID: Channel.id,
                NoneRoleID: DefaultRole.id,
                VerifiedRoleID: VerifiedRole.id,
            },
            {
                new: true,
                upsert: true,
            }
        );

        interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor("#95CCF5")
                    .setDescription(`成功設定 **Captcha系統**`)
            ], ephemeral: true
        });

    },
};