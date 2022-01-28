const { CommandInteraction, MessageActionRow, MessageEmbed, MessageButton, MessageAttachment } = require("discord.js");
const DB = require("../../Structures/Schemas/CaptchaSys");

module.exports = {
    name: "verify",
    description: "認證系統 (你不是機器人對ㄅ)",
    cooldown: 60000,
    /**
     * 
     * @param {CommandInteraction} interaction 
     */

    async execute(interaction) {
        const { channel, guild } = interaction;

        DB.findOne({ GuildID: guild.id }, async (err, data) => {
            if (err) throw err;
            if (!data) return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("請先設定 **Captcha 系統**")
                ], ephemeral: true
            });
            else if (channel.id !== data.ChannelID) return;
            else {
                const Buttons = new MessageActionRow();
                Buttons.addComponents(
                    new MessageButton()
                        .setCustomId("接受認證")
                        .setLabel("接受認證")
                        .setStyle("SUCCESS")
                        .setEmoji("📝"),
                );

                const Embed = new MessageEmbed()
                    .setColor("#95CCF5")
                    .setTitle("點擊按鈕來進行認證")
                    .setFooter({ text: '小提醒 : 點擊按鈕後機器人將私訊你認證訊息，如果你尚未開啟私訊，請開啟!' });

                interaction.reply({ embeds: [Embed], components: [Buttons] });

                let filter = i => i.customId === '接受認證' && i.user.id === interaction.user.id;

                const collector = interaction.channel.createMessageComponentCollector({ filter });

                setTimeout(() => {
                    collector.stop()
                }, 300000)

                collector.on('collect', async i => {
                    if (i.customId === '接受認證') {
                        interaction.deleteReply()
                        const person = interaction.guild.members.cache.get(i.user.id)

                        try {
                            const { CaptchaGenerator } = require("captcha-canvas");

                            // 圖片
                            const Captcha = new CaptchaGenerator()
                                .setDimension(150, 400)
                                .setCaptcha({ font: "Sans", size: 60, color: "#95CCF5" })
                                .setDecoy({ opacity: 0.5 })
                                .setTrace({ color: "#95CCF5" });

                            // 附件
                            const CaptchaAttachment = new MessageAttachment(
                                await Captcha.generate(),
                                "captcha.png"
                            );

                            const CaptchaEmbed = new MessageEmbed()
                                .setAuthor({ name: `認證系統`, iconURL: `${guild.iconURL({ dynamic: true, size: 512 })}` })
                                .setDescription(
                                    "\請輸入下列正確的英文符號和數字來通過認證\n\n" +
                                    "💡 __**小提示 : **__\n\n" +
                                    "> 從左到右，輸入帶有顏色的英文符號\n" +
                                    "> 忽略其他灰色的符號，並注意大小寫")
                                .setImage("attachment://captcha.png")
                                .setColor('#95CCF5')
                                .setFooter({ text: '認證時限 : 60 秒' });

                            const msg = await person.send({
                                files: [CaptchaAttachment],
                                embeds: [CaptchaEmbed],
                                ephemeral: true,
                            });

                            const answer = Captcha.text;

                            const filtere = i => i.id === interaction.user.id;
                            const messageCollector = msg.channel.createMessageCollector({ filtere, time: 60000 });
                            messageCollector.on('collect', async m => {
                                try {
                                    if (m.content === answer) {
                                        messageCollector.stop()
                                        const noneverifiedRole = data.NoneRoleID;
                                        const verifiedRole = data.VerifiedRoleID;
                                        person.roles.remove(`${noneverifiedRole}`);
                                        person.roles.add(`${verifiedRole}`);
                                        m.reply({
                                            embeds: [
                                                new MessageEmbed()
                                                    .setColor("#95CCF5")
                                                    .setDescription(`認證成功 ! 你現在已可以瀏覽 **${interaction.guild.name}**`)
                                            ]
                                        });
                                    } else {
                                        messageCollector.stop()
                                        await m.reply({
                                            embeds: [
                                                new MessageEmbed()
                                                    .setColor("#95CCF5")
                                                    .setDescription(`認證失敗 ! 請重試 !`)
                                            ]
                                        });
                                    };
                                } catch (err) {
                                    console.log(err);
                                };
                            });

                            messageCollector.on('end', collected => {
                                if (collected.size == 0) {
                                    msg.channel.send({
                                        embeds: [
                                            new MessageEmbed()
                                                .setColor("RED")
                                                .setDescription("你並無輸入答案，請重新輸入一次認證命令")
                                        ]
                                    });

                                    setTimeout(() => {
                                        msg.delete();
                                    }, 2000);
                                };
                            });

                        } catch (err) {
                            interaction.followUp({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor("RED")
                                        .setDescription(`<@${i.user.id}>, 你似乎忘記開啟私訊，請重試 !`)
                                ], ephemeral: true
                            });
                            console.log(err);
                        }
                        collector.stop();
                    };
                });

                collector.on('end', collected => {
                    if (collected.size == 0) {
                        msg.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor("RED")
                                    .setDescription(`<@${interaction.user.id}>，你並無輸入答案，請重新輸入一次認證命令`)
                            ]
                        });

                        setTimeout(() => {
                            msg.delete();
                        }, 2000);
                    };
                    return;
                });
            };
        });
    },
};
