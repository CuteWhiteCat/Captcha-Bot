const { ButtonInteraction, MessageAttachment, MessageEmbed } = require("discord.js");

// Captcha
const { CaptchaGenerator } = require("captcha-canvas");

// Database 
const DB = require("../../Structures/Schemas/verifyButtons");
const SysDB = require("../../Structures/Schemas/CaptchaSys");

module.exports = {
    name: "interactionCreate",

    /**
     * 
     * @param {ButtonInteraction} interaction 
     */

    async execute(interaction) {
        // 判斷是否為按鈕
        if (!interaction.isButton()) return;

        // 簡化 Code
        const { customId, message, guild, user, guildId } = interaction;

        // 按鈕內容判斷
        if (!["接受認證"].includes(customId)) return;

        // 按鈕思考
        await interaction.deferUpdate();

        // Database 找使用者
        DB.findOne({ GuildID: guildId, MsgID: message.id }, async (err, data) => {
            // Error
            if (err) throw err;

            // 無法找到 Data
            if (!data) return;

            // 判斷是否為使用 verify 的使用者 
            if (interaction.user.id !== data.UserID) return;

            // 刪除訊息
            interaction.deleteReply();

            // 顏色
            const Color_Finder = await SysDB.findOne({ GuildID: guildId });
            let Captcha_Color = "abcde";
            if (Color_Finder) {
                Captcha_Color = Color_Finder.Color;
            }

            // DM 的 對象
            const target = guild.members.cache.get(data.UserID);

            // 圖片設定
            const Captcha = new CaptchaGenerator()
                .setDimension(150, 400)
                .setCaptcha({ font: "Sans", size: 60, color: `${Captcha_Color}` })
                .setDecoy({ opacity: 0.5 })
                .setTrace({ color: `${Captcha_Color}` });

            // 附件
            const CaptchaAttachment = new MessageAttachment(
                await Captcha.generate(),
                "captcha.png"
            );

            // Captcha Embed
            const CaptchaEmbed = new MessageEmbed()
                .setAuthor({ name: `認證系統`, iconURL: `${guild.iconURL({ dynamic: true, size: 512 })}` })
                .setDescription(
                    "\請輸入下列正確的英文符號和數字來通過認證\n\n" +
                    "💡 __**小提示 : **__\n\n" +
                    "> 從左到右，輸入帶有顏色的英文符號\n" +
                    "> 忽略其他灰色的符號，並注意大小寫")
                .setImage("attachment://captcha.png")
                .setColor(`${Captcha_Color}`)
                .setFooter({ text: '認證時限 : 60 秒' });

            try {
                // 傳送訊息
                const msg = await target.send({
                    files: [CaptchaAttachment],
                    embeds: [CaptchaEmbed],
                });

                // 使用次數
                await DB.findOneAndUpdate({ GuildID: guildId, MsgID: data.MsgID }, { Used: 1 });

                // Captcha 答案
                const answer = Captcha.text;

                // 訊息 Collector
                const messageCollector = msg.channel.createMessageCollector({ time: 60000 });

                // 成功擷取訊息
                messageCollector.on('collect', async m => {
                    try {
                        if (m.content === answer) {
                            // Collector Stop
                            messageCollector.stop();

                            let Captcha_System = await SysDB.findOne({ GuildID: guildId });
                            if (Captcha_System) {
                                // 簡化 Code
                                const noneverifiedRole = Captcha_System.NoneRoleID;
                                const verifiedRole = Captcha_System.VerifiedRoleID;
                                // 身分組添加
                                target.roles.remove(`${noneverifiedRole}`);
                                target.roles.add(`${verifiedRole}`);
                            }

                            // 刪除 Captcha
                            await msg.delete();

                            // 認證成功訊息
                            await m.reply({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(`${Captcha_Color}`)
                                        .setDescription(`認證成功 ! 你現在已可以瀏覽 **${guild.name}**`)
                                ]
                            });

                            // Database 資料刪除
                            await DB.findOneAndDelete({ GuildID: guildId, MsgID: data.MsgID });

                        } else {
                            // Collector Stop
                            messageCollector.stop();

                            // 刪除 Captcha
                            await msg.delete();

                            // 認證失敗訊息
                            await m.reply({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(`${Captcha_Color}`)
                                        .setDescription(`認證失敗 ! 請重試 !`)
                                ]
                            });

                            // Kick
                            const Kicked_Finder = await DB.findOne({ GuildID: guild.id, UserID: user.id })
                            const Kicked_Times = Kicked_Finder.Kicked;
                            await DB.findOneAndUpdate({ GuildID: guild.id, UserID: user.id }, {Kicked: parseInt(Kicked_Times + 1)});

                            if (Kicked_Finder.Kicked == 2) {
                                if (target.kickable) {
                                    target.kick({ reason: "認證錯誤" });
                                }
                                await DB.findOneAndDelete({ GuildID: guildId, MsgID: data.MsgID });
                            };

                            // 使用次數歸零
                            await DB.findOneAndUpdate({ GuildID: guildId, MsgID: data.MsgID }, { Used: 0 })
                        };
                    } catch (err) {
                        console.log(err);
                    };
                });


                messageCollector.on('end', async collected => {
                    // 無任何訊息
                    if (collected.size == 0) {
                        // 無輸入答案 Embed
                        await msg.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor("RED")
                                    .setDescription("你並無輸入答案，請重新輸入一次認證命令")
                            ]
                        });

                        // 無輸入答案 Embed 刪除
                        setTimeout(async () => {
                            await msg.delete();
                        }, 2000);
                    };
                });
            } catch (err) {
                interaction.followUp({
                    embeds: [
                        new MessageEmbed()
                            .setColor("RED")
                            .setDescription(`<@${user.id}>，你似乎忘記開啟私訊，請重試 !`)
                    ], ephemeral: true
                });
            };
        });
    },
};