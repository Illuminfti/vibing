const { SlashCommandBuilder } = require('discord.js');
const { startConfession } = require('../components/flows/gate3Flow');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('complete the third gate - the confession'),

    async execute(interaction) {
        await startConfession(interaction);
    },
};
