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

            name: "color",
            description: "Captcha 顏色 (請輸入 Hex 編碼)",
            type: "STRING",
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
        // 簡化 Code
        const { guild, options } = interaction;

        // 指令選項
        const Channel = options.getChannel("channel");
        const Color = options.getString("color");
        const DefaultRole = options.getRole("default-role");
        const VerifiedRole = options.getRole("verified-role");

        // Hex Color Test
        if (!(/^#[0-9A-F]{6}$/i.test(`${Color}`))) return await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(`RED`)
                    .setDescription(`此 **Hex Color** 不存在，請重試`)
            ], ephemeral: true
        });

        // MongoDB Database 創建
        await DB.findOneAndUpdate(
            { GuildID: guild.id },
            {
                GuildID: guild.id,
                ChannelID: Channel.id,
                Color: Color,
                NoneRoleID: DefaultRole.id,
                VerifiedRoleID: VerifiedRole.id,
            },
            {
                new: true,
                upsert: true,
            }
        );

        // 成功訊息 (Embed)
        await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setColor(`${Color}`)
                    .setTitle(`成功設定 **Captcha系統**`)
                    .setFooter({ text: "💡 : 請確認此訊息的左側即為你設置的顏色" })
            ], ephemeral: true
        });

    },
};