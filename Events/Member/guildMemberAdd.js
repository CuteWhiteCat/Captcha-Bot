const { MessageEmbed, WebhookClient, GuildMember } = require("discord.js");
const DB = require("../../Structures/Schemas/CaptchaSys");

module.exports = {
    name: "guildMemberAdd",
    /**
     * 
     * @param {GuildMember} member 
     */
    execute(member) {
        const { guild } = member;
        
        // 身分組
        DB.findOne({ GuildID: guild.id }, async (err, data) => {
            if (err) throw err;
            if (!data) return;
            member.roles.add(`${data.NoneRoleID}`);
        });
    }
}