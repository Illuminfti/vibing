const { SlashCommandBuilder } = require('discord.js');
const { processGate5 } = require('../gates/gate5');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('absence')
        .setDescription('complete the fifth gate - the absence')
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('tell her why you\'re here')
                .setRequired(true)
        ),

    async execute(interaction) {
        await processGate5(interaction);
    },
};
