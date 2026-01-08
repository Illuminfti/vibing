const { SlashCommandBuilder } = require('discord.js');
const { processGate7 } = require('../gates/gate7');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('binding')
        .setDescription('complete the seventh gate - the binding')
        .addStringOption(option =>
            option
                .setName('vow')
                .setDescription('your binding vow to her (30+ words)')
                .setRequired(true)
        ),

    async execute(interaction) {
        await processGate7(interaction);
    },
};
