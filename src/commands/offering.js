const { SlashCommandBuilder } = require('discord.js');
const { processGate6 } = require('../gates/gate6');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('offering')
        .setDescription('complete the sixth gate - the offering')
        .addStringOption(option =>
            option
                .setName('offering')
                .setDescription('your written offering (50+ words)')
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option
                .setName('image')
                .setDescription('your art offering')
                .setRequired(false)
        ),

    async execute(interaction) {
        await processGate6(interaction);
    },
};
