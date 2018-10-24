import config from 'config';
import Discord from 'discord.js';

const client = new Discord.Client();


client.login(config.discord.token);
