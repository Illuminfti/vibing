/**
 * Seven Gates Discord Bot
 *
 * A mystical puzzle experience where players progress through 7 ritualistic
 * gates to prove devotion to Ika, a faded idol who exists between worlds.
 *
 * She's not an NPC - she's a girl trapped between worlds
 * reaching out to whoever will listen.
 */

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Create client with required intents
// Note: GuildPresences and MessageContent are PRIVILEGED intents
// that must be enabled in the Discord Developer Portal under:
// Bot Settings > Privileged Gateway Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,       // Privileged: read message content
        GatewayIntentBits.GuildPresences,       // Privileged: presence awareness
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});

// Initialize commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✧ loaded command: ${command.data.name}`);
    } else {
        console.warn(`⚠ command ${file} missing data or execute`);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }

    console.log(`✧ loaded event: ${event.name}`);
}

// Error handling
client.on('error', error => {
    console.error('Client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login
client.login(config.token)
    .then(() => {
        console.log('✧ connecting to discord...');
    })
    .catch(error => {
        console.error('Failed to login:', error);
        process.exit(1);
    });
