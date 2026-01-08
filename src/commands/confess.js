const { SlashCommandBuilder } = require('discord.js');
const { processGate3 } = require('../gates/gate3');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('complete the third gate - the confession')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('link to your public confession about ika')
                .setRequired(true)
        ),

    async execute(interaction) {
        await processGate3(interaction);
    },
};
