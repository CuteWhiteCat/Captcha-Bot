const { CommandInteraction, MessageActionRow, MessageEmbed, MessageButton } = require("discord.js");

// Database
const SysDB = require("../../Structures/Schemas/CaptchaSys");
const ButtonDB = require("../../Structures/Schemas/verifyButtons");

module.exports = {
    name: "verify",
    description: "認證系統 (你不是機器人對ㄅ)",
    cooldown: 10000,
    /**
     * 
     * @param {CommandInteraction} interaction 
     */

    async execute(interaction) {
        // 簡化 Code
        const { channel, guild, user } = interaction;

        // Captcha 頻道確認
        SysDB.findOne({ GuildID: guild.id }, async (err, data) => {
            // Error
            if (err) throw err;

            // 尚未設定 Captcha 系統    
            if (!data)
                return await interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor("RED")
                            .setDescription("請先設定 **Captcha 系統**")
                    ], ephemeral: true
                });

            // 使用者連續使用兩次
            let b = await ButtonDB.findOne({ GuildID: guild.id, UserID: user.id });
            if (b) {
                if (b.Used == 1)
                    return interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor("RED")
                                .setDescription("你尚未完成上一次的認證，無法建立新的認證")
                        ], ephemeral: true
                    });
            };

            // Captcha 頻道偵測
            if (channel.id !== data.ChannelID) return;

            // 判斷時間
            await interaction.deferReply();

            // 確認按鈕
            const Buttons = new MessageActionRow();
            Buttons.addComponents(
                new MessageButton()
                    .setCustomId("接受認證")
                    .setLabel("接受認證")
                    .setStyle("SUCCESS")
                    .setEmoji("📝"),
            );

             // 顏色
            const Captcha_Color = await data.Color;
            // 確認 Embed
            const Embed = new MessageEmbed()
                .setColor(`${Captcha_Color}`)
                .setTitle("點擊按鈕來進行認證")
                .setDescription("**__💡小提醒__** : **如果你尚未開啟私訊，請開啟!**")
                .setFooter({ text: `ID: ${user.id} | ${user.username}`, iconURL: user.avatarURL({ dynamic: true }) });

            // 發送確認訊息
            await interaction.editReply({ embeds: [Embed], components: [Buttons] });

            const msg = await interaction.fetchReply();

            // Kick 次數
            var Kicked_Times = 0;
            const Kicked_Finder = await ButtonDB.findOne({ GuildID: guild.id, UserID: user.id, })
            if (Kicked_Finder) Kicked_Times = parseInt(Kicked_Finder.Kicked);

            // MongoDB Database 創建
            await ButtonDB.findOneAndUpdate(
                {
                    GuildID: guild.id,
                    UserID: user.id,
                },
                {
                    GuildID: guild.id,
                    MsgID: msg.id,
                    UserID: user.id,
                    Used: 0,
                    Kicked: Kicked_Times,
                },
                {
                    upsert: true,
                    new: true,
                },
            );
        });
    },
};
