const { SlashCommandBuilder } = require('discord.js');
const { processGate4 } = require('../gates/gate4');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('waters')
        .setDescription('complete the fourth gate - the waters')
        .addStringOption(option =>
            option
                .setName('answer')
                .setDescription('where does she live?')
                .setRequired(true)
        ),

    async execute(interaction) {
        await processGate4(interaction);
    },
};
