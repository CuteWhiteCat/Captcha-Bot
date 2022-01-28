const { Client, Collection } = require("discord.js");
const client = new Client({ intents: 32767 });
const { Token } = require("../Structures/config.json");
const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const Ascii = require("ascii-table");

client.commands = new Collection();

["Events", "Commands"].forEach(handler => {
    require(`./Handlers/${handler}`)(client, PG, Ascii);
});

client.login(Token).then(() => {
    console.log("登入機器人為 " + client.user.tag)
}).catch((err) => {
    console.log(err)
});