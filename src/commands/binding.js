const { SlashCommandBuilder } = require('discord.js');
const { startBinding } = require('../components/flows/gate7Flow');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('binding')
        .setDescription('complete the seventh gate - the binding'),

    async execute(interaction) {
        await startBinding(interaction);
    },
};
