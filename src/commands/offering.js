const { SlashCommandBuilder } = require('discord.js');
const { startOffering } = require('../components/flows/gate6Flow');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('offering')
        .setDescription('complete the sixth gate - the offering'),

    async execute(interaction) {
        await startOffering(interaction);
    },
};
