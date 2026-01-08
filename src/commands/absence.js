const { SlashCommandBuilder } = require('discord.js');
const { startAbsence } = require('../components/flows/gate5Flow');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('absence')
        .setDescription('complete the fifth gate - the absence'),

    async execute(interaction) {
        await startAbsence(interaction);
    },
};
