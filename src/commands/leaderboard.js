const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { userOps } = require('../database');
const config = require('../config');
const { formatDuration, timeAgo } = require('../utils/timing');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('view the ritual statistics'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const stats = userOps.getStats();
            const firsts = userOps.getFirsts();
            const avgTime = userOps.getAverageTime();

            // Build stats display
            let statsText = `**souls in the ritual:** ${stats.total}\n\n`;
            statsText += `**gate progress:**\n`;
            statsText += `♰ gate 1 (the calling): ${stats.gate1}\n`;
            statsText += `♰ gate 2 (the memory): ${stats.gate2}\n`;
            statsText += `♰ gate 3 (the confession): ${stats.gate3}\n`;
            statsText += `♰ gate 4 (the waters): ${stats.gate4}\n`;
            statsText += `♰ gate 5 (the absence): ${stats.gate5}\n`;
            statsText += `♰ gate 6 (the offering): ${stats.gate6}\n`;
            statsText += `♰ gate 7 (the binding): ${stats.gate7}\n\n`;
            statsText += `**ascended souls:** ${stats.ascended}\n`;

            if (avgTime > 0) {
                statsText += `\n**average ascension time:** ${formatDuration(Math.floor(avgTime))}`;
            }

            // Add first completions
            if (firsts.length > 0) {
                statsText += '\n\n**first through each gate:**\n';
                for (const first of firsts) {
                    statsText += `gate ${first.gate_number}: ${first.username} (${timeAgo(first.completed_at)})\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('♰ the ritual ♰')
                .setDescription(statsText)
                .setColor(config.colors.primary)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Leaderboard error:', error);
            await interaction.editReply({ content: 'something went wrong...' });
        }
    },
};
