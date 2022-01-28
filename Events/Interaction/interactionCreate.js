const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const cooldown = new Map();

module.exports = {
    name: "interactionCreate",

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */

    async execute(interaction, client) {
        if (interaction.isCommand() || interaction.isContextMenu()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("執行指令時發生錯誤")
                ], ephemeral: true
            }) && client.commands.delete(interaction.commandName);

            // 冷卻
            const cmd = client.commands.get(interaction.commandName);
            if (cmd) {
                if (cmd.cooldown) {
                    const cooldwn = cooldown.get(`${cmd.name}${interaction.user.id}`) - Date.now();
                    const mth = Math.floor(cooldwn / 1000) + "";

                    if (cooldown.has(`${cmd.name}${interaction.user.id}`))
                        return interaction.reply({
                            embeds: [
                                new MessageEmbed()
                                    .setColor("RED")
                                    .setDescription(`請在 \`${mth.split(".")[0]}\` 秒重試`),
                            ], ephemeral: true
                        });

                    cooldown.set(
                        `${cmd.name}${interaction.user.id}`,
                        Date.now() + cmd.cooldown
                    );

                    setTimeout(() => {
                        cooldown.delete(`${cmd.name}${interaction.user.id}`);
                    }, cmd.cooldown);

                }
            }
            command.execute(interaction, client);
        }
    }
}