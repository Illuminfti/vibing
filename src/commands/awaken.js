const { SlashCommandBuilder } = require('discord.js');
const { startAwakening } = require('../components/flows/gate1Flow');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('awaken')
        .setDescription('begin the first gate - the awakening'),

    async execute(interaction) {
        await startAwakening(interaction);
    },
};
