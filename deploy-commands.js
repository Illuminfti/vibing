/**
 * Deploy slash commands to Discord
 *
 * Run this script to register/update slash commands:
 * node deploy-commands.js
 */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error('Missing required environment variables');
    console.error('Make sure DISCORD_TOKEN, CLIENT_ID, and GUILD_ID are set in .env');
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`✧ loaded: ${command.data.name}`);
    } else {
        console.warn(`⚠ ${file} missing data property`);
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`\n✧ deploying ${commands.length} commands...`);

        // Deploy to specific guild (faster for development)
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`✧ successfully deployed ${data.length} commands`);

        // List deployed commands
        console.log('\ndeployed commands:');
        for (const cmd of data) {
            console.log(`  /${cmd.name}`);
        }

    } catch (error) {
        console.error('Deployment failed:', error);
    }
})();
