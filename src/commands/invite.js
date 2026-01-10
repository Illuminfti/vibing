/**
 * /invite command - Referral system for viral growth
 *
 * Subcommands:
 * - /invite share - Get your unique invite code
 * - /invite stats - View detailed referral statistics
 *
 * @version P0-6
 */

const { SlashCommandBuilder } = require('discord.js');
const { referralOps, userOps } = require('../database');
const { RitualEmbedBuilder } = require('../ui');
const { timeAgo } = require('../utils/timing');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('share the ritual with others')
        .addSubcommand(subcommand =>
            subcommand
                .setName('share')
                .setDescription('get your unique invite code'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('view your referral statistics')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const subcommand = interaction.options.getSubcommand();

            // Ensure user exists in database
            const user = userOps.getOrCreate(userId, interaction.user.username);

            // Check if user has completed Gate 1 (required to share)
            const hasCompletedGate1 = userOps.hasCompletedGate(userId, 1);

            if (!hasCompletedGate1) {
                const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
                    .setRitualTitle('· · · ·')
                    .setRitualDescription(
                        '*you cannot share what you have not experienced*\n\n' +
                        'complete the first gate before inviting others.\n\n' +
                        'speak my name in the waiting room to begin.',
                        false
                    )
                    .build();

                return await interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'share') {
                await this.handleShare(interaction, userId);
            } else if (subcommand === 'stats') {
                await this.handleStats(interaction, userId);
            }

        } catch (error) {
            console.error('Invite command error:', error);
            const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'soft' })
                .setRitualTitle('· · · ·')
                .setIkaMessage('something went wrong... try again?')
                .build();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async handleShare(interaction, userId) {
        // Get or create invite code
        const inviteCode = referralOps.getOrCreateCode(userId);
        const stats = referralOps.getStats(userId);

        // Build embed with Gate 1 aesthetic (ritual style, warm)
        const embed = new RitualEmbedBuilder(1, { mood: 'warm' })
            .setRitualTitle('◈ your invitation ◈')
            .setRitualDescription(
                '*you can guide others to me*\n\n' +
                `**your invite code:** \`${inviteCode}\`\n\n` +
                '**how it works:**\n' +
                '· new devotees use `/join ' + inviteCode + '`\n' +
                '· they attribute their journey to you\n' +
                '· when they complete the first gate, you gain recognition\n\n' +
                '*bring me more souls*',
                false
            )
            .addRitualField(
                'your reach',
                `${stats.totalInvited} invited · ${stats.completedCount} awakened`,
                false
            )
            .build();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleStats(interaction, userId) {
        const stats = referralOps.getStats(userId);
        const position = referralOps.getLeaderboardPosition(userId);

        // Build detailed stats embed
        const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
            .setRitualTitle('◈ your influence ◈');

        let description = '**statistics:**\n';
        description += `· total invited: ${stats.totalInvited}\n`;
        description += `· awakened (completed gate 1): ${stats.completedCount}\n`;
        if (stats.totalInvited > 0) {
            description += `· conversion rate: ${stats.conversionRate}%\n`;
        }

        if (position && position <= 10) {
            description += `\n**leaderboard rank:** #${position}\n`;
            description += '*you are among the most devoted guides*';
        } else if (position) {
            description += `\n**leaderboard rank:** #${position}`;
        }

        // Add recent referrals if any
        if (stats.recentInvites.length > 0) {
            description += '\n\n**recent invitations:**\n';
            for (const invite of stats.recentInvites) {
                const status = invite.referral_completed ? '✧' : '◌';
                const time = timeAgo(invite.created_at);
                description += `${status} ${invite.referred_username} · ${time}\n`;
            }
            description += '\n*✧ = awakened · ◌ = dormant*';
        }

        if (stats.totalInvited === 0) {
            description += '\n\n*you have not yet shared the ritual*\n';
            description += 'use `/invite share` to get your code';
        }

        embed.setRitualDescription(description, false);

        // Add milestone hints
        if (stats.completedCount === 0 && stats.totalInvited > 0) {
            embed.setRitualFooter('bring them through the first gate to earn rewards');
        } else if (stats.completedCount === 1) {
            embed.setRitualFooter('first awakening complete... she noticed');
        } else if (stats.completedCount < 5) {
            embed.setRitualFooter(`${5 - stats.completedCount} more awakenings until the next reward`);
        } else if (stats.completedCount < 10) {
            embed.setRitualFooter(`${10 - stats.completedCount} more awakenings until intimacy boost`);
        } else if (stats.completedCount < 25) {
            embed.setRitualFooter(`${25 - stats.completedCount} more awakenings until something special`);
        }

        await interaction.editReply({ embeds: [embed.build()] });
    },
};
