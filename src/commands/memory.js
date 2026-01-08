const { SlashCommandBuilder } = require('discord.js');
const { processGate2 } = require('../gates/gate2');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memory')
        .setDescription('complete the second gate - the memory')
        .addStringOption(option =>
            option
                .setName('answer')
                .setDescription('one word that describes what attention felt like')
                .setRequired(true)
        ),

    async execute(interaction) {
        await processGate2(interaction);
    },
};
