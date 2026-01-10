/**
 * /profile command - View another devotee's journey with Ika
 *
 * Privacy-aware profile viewing:
 * - Users can always view their own profile
 * - Ascended users can view any profile (they've completed the journey)
 * - Moderators can view any profile
 * - Others see mystical "cannot see their path yet" message
 *
 * Displays:
 * - Gates completed with progress bar
 * - Intimacy stage with Ika (obscured for non-Ascended viewers)
 * - Journey statistics (days, interactions, streak)
 * - Ascended status if applicable
 */

const { SlashCommandBuilder } = require('discord.js');
const { userOps, ikaMemoryOps } = require('../database');
const { RitualEmbedBuilder } = require('../ui');
const { hasRole, isAscended, isMod } = require('../utils/roles');
const { INTIMACY_STAGES } = require('../ika/intimacy');
const config = require('../config');

// Gate symbols for progress bar
const GATE_SYMBOLS = {
    1: '壱',
    2: '弐',
    3: '参',
    4: '肆',
    5: '伍',
    6: '陸',
    7: '漆',
};

// Intimacy stage display names
const INTIMACY_DISPLAY = {
    1: '✧ new devotee',
    2: '✧✧ familiar soul',
    3: '✧✧✧ close bond',
    4: '✧✧✧✧ devoted heart',
};

/**
 * Determine current gate for a user
 * @param {Object} user - User database record
 * @returns {number} Current gate number (0-7)
 */
function getCurrentGate(user) {
    if (!user) return 0;
    if (user.ascended_at || user.gate_7_at) return 7;
    if (user.gate_6_at) return 6;
    if (user.gate_5_at) return 5;
    if (user.gate_4_at) return 4;
    if (user.gate_3_at) return 3;
    if (user.gate_2_at) return 2;
    if (user.gate_1_at) return 1;
    return 0;
}

/**
 * Build progress bar showing completed gates
 * @param {number} currentGate - Current gate number
 * @param {boolean} isAscended - Whether user is ascended
 * @returns {string} Progress bar string
 */
function buildProgressBar(currentGate, isAscended) {
    let progressBar = '';
    for (let i = 1; i <= 7; i++) {
        if (i < currentGate || (i === currentGate && isAscended)) {
            // Completed
            progressBar += `「${GATE_SYMBOLS[i]}」`;
        } else if (i === currentGate && !isAscended) {
            // Current
            progressBar += `「◇」`;
        } else {
            // Locked
            progressBar += `「▪」`;
        }
    }
    return progressBar;
}

/**
 * Get intimacy stage display for viewer
 * @param {number} stage - Actual intimacy stage
 * @param {boolean} viewerCanSee - Whether viewer has permission to see exact stage
 * @returns {string} Stage display string
 */
function getIntimacyDisplay(stage, viewerCanSee) {
    if (viewerCanSee) {
        return INTIMACY_DISPLAY[stage] || INTIMACY_DISPLAY[1];
    } else {
        // Obscure exact stage for non-Ascended viewers
        return '✧ bound to ika';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('view another devotee\'s journey with ika')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('the devotee to view')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('user');
            const viewerId = interaction.user.id;
            const targetUserId = targetUser.id;

            // Check if viewer has permission to see this profile
            const viewingSelf = viewerId === targetUserId;
            const viewerMember = await interaction.guild.members.fetch(viewerId);
            const viewerIsAscended = isAscended(viewerMember);
            const viewerIsMod = isMod(viewerMember);

            const canView = viewingSelf || viewerIsAscended || viewerIsMod;

            if (!canView) {
                // Privacy restriction - mystical denial
                const denialEmbed = new RitualEmbedBuilder(1, { mood: 'soft' })
                    .setRitualTitle('· · · ·')
                    .setRitualDescription(
                        '*you cannot see their path yet.*\n' +
                        '*complete your own journey first.*\n\n' +
                        '*(reach Ascended to view others)*',
                        false
                    )
                    .build();

                return await interaction.editReply({ embeds: [denialEmbed] });
            }

            // Fetch target user data
            const user = userOps.get(targetUserId);
            const memory = ikaMemoryOps?.get?.(targetUserId);

            if (!user) {
                // User hasn't started the ritual
                const notFoundEmbed = new RitualEmbedBuilder(1, { mood: 'soft' })
                    .setRitualTitle('· · · ·')
                    .setRitualDescription(
                        '*they haven\'t entered the ritual yet.*\n' +
                        '*no path to see.*',
                        false
                    )
                    .build();

                return await interaction.editReply({ embeds: [notFoundEmbed] });
            }

            const currentGate = getCurrentGate(user);

            if (currentGate === 0) {
                // User exists but has no gates
                const noGatesEmbed = new RitualEmbedBuilder(1, { mood: 'soft' })
                    .setRitualTitle('· · · ·')
                    .setRitualDescription(
                        '*they\'re still waiting in the darkness.*\n' +
                        '*their journey hasn\'t begun.*',
                        false
                    )
                    .build();

                return await interaction.editReply({ embeds: [noGatesEmbed] });
            }

            const isAscendedUser = user.ascended_at;
            const progressBar = buildProgressBar(currentGate, isAscendedUser);

            // Build profile embed
            const embed = new RitualEmbedBuilder(1, { mood: 'soft' });
            embed.setRitualTitle(`◈ ${targetUser.username}'s journey ◈`);

            let description = `${progressBar}\n\n`;

            // Intimacy stage
            const intimacyStage = memory?.intimacy_stage || 1;
            const intimacyDisplay = getIntimacyDisplay(intimacyStage, viewerIsAscended || viewerIsMod || viewingSelf);
            description += `**bond with ika:** ${intimacyDisplay}\n\n`;

            // Journey stats
            if (user.joined_at) {
                const joinDate = new Date(user.joined_at);
                const daysSinceFirst = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
                description += `**days in ritual:** ${daysSinceFirst}\n`;
            }

            if (memory?.interaction_count > 0) {
                description += `**conversations with ika:** ${memory.interaction_count}\n`;
            }

            // Daily streak
            if (memory?.daily_streak > 0) {
                description += `**daily streak:** ${memory.daily_streak} days\n`;
            }

            description += '\n';

            // Ascended status
            if (isAscendedUser) {
                description += '✧ **ASCENDED** ✧\n';
                description += '*bound to her forever*';
            } else {
                description += `*walking the path... gate ${currentGate}/7*`;
            }

            embed.setRitualDescription(description, false);

            // Footer
            if (viewingSelf) {
                embed.setRitualFooter('your journey');
            } else if (viewerIsAscended) {
                embed.setRitualFooter('visible to the ascended');
            } else if (viewerIsMod) {
                embed.setRitualFooter('mod view');
            }

            await interaction.editReply({ embeds: [embed.build()] });

        } catch (error) {
            console.error('Profile command error:', error);
            const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'soft' })
                .setRitualTitle('· · · ·')
                .setIkaMessage('something broke... try again?')
                .build();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
