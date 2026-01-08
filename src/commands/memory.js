const { SlashCommandBuilder } = require('discord.js');
const { startMemory } = require('../components/flows/gate2Flow');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memory')
        .setDescription('complete the second gate - the memory'),

    async execute(interaction) {
        // Start the interactive memory flow instead of direct processing
        await startMemory(interaction);
    },
};
