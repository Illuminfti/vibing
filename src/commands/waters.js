const { SlashCommandBuilder } = require('discord.js');
const { startWaters } = require('../components/flows/gate4Flow');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('waters')
        .setDescription('complete the fourth gate - the waters'),

    async execute(interaction) {
        await startWaters(interaction);
    },
};
