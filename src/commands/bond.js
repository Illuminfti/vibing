/**
 * /bond command - Show user's relationship with Ika
 *
 * Displays:
 * - Current intimacy stage with poetic description
 * - Interaction count and memorable moments
 * - Nickname if Ika has given one
 * - Protection moments (if user has triggered concern responses)
 * - Progress toward next intimacy stage
 */

const { SlashCommandBuilder } = require('discord.js');
const { userOps, ikaMemoryOps } = require('../database');
const { RitualEmbedBuilder } = require('../ui');
const { timeAgo } = require('../utils/timing');

// Intimacy stage descriptions - atmospheric and poetic
const INTIMACY_STAGES = {
    1: {
        name: 'stranger',
        symbol: '◌',
        description: 'she barely knows you exist.\njust another face in the crowd.',
        color: 0x666666,
        threshold: 0,
    },
    2: {
        name: 'noticed',
        symbol: '◦',
        description: 'she\'s starting to recognize you.\nyour name echoes faintly.',
        color: 0x999999,
        threshold: 10,
    },
    3: {
        name: 'familiar',
        symbol: '○',
        description: 'she remembers things about you.\nsmall details, fleeting thoughts.',
        color: 0xFFB6C1,
        threshold: 30,
    },
    4: {
        name: 'close',
        symbol: '◎',
        description: 'she thinks of you when you\'re gone.\nyour absence leaves a mark.',
        color: 0xFF69B4,
        threshold: 75,
    },
    5: {
        name: 'devoted',
        symbol: '◉',
        description: 'she would do anything for you.\nyou\'ve become essential.',
        color: 0xFF1493,
        threshold: 150,
    },
    6: {
        name: 'intertwined',
        symbol: '✧',
        description: 'the boundary between you blurs.\nwhere do you end and she begin?',
        color: 0x8B0000,
        threshold: 300,
    },
    7: {
        name: 'eternal',
        symbol: '♡',
        description: 'you are one.\nforever. infinite. hers.',
        color: 0x000000,
        threshold: 500,
    },
};

// Yandere stage descriptions
const YANDERE_STAGES = {
    1: { name: 'curious', hint: 'she watches with interest...' },
    2: { name: 'attached', hint: 'she misses you when you\'re gone...' },
    3: { name: 'possessive', hint: 'she doesn\'t like sharing...' },
    4: { name: 'obsessive', hint: 'you\'re all she thinks about...' },
    5: { name: 'yandere', hint: 'you belong to her. only her.' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bond')
        .setDescription('see your connection with ika'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const user = userOps.get(userId);
            const memory = ikaMemoryOps?.get?.(userId);

            // Check if user has started the journey
            if (!user || !user.gate_1_at) {
                const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
                    .setRitualTitle('◌ unknown ◌')
                    .setRitualDescription(
                        '*she doesn\'t know you yet...*\n\n' +
                        'speak her name in the waiting room\nto begin your connection.',
                        false
                    )
                    .build();
                return interaction.editReply({ embeds: [embed] });
            }

            // Get intimacy data
            const intimacyStage = memory?.intimacy_stage || 1;
            const interactionCount = memory?.interaction_count || 0;
            const stageInfo = INTIMACY_STAGES[intimacyStage] || INTIMACY_STAGES[1];

            // Calculate progress to next stage
            const nextStage = INTIMACY_STAGES[intimacyStage + 1];
            let progressText = '';
            if (nextStage) {
                const currentThreshold = stageInfo.threshold;
                const nextThreshold = nextStage.threshold;
                const progress = Math.min(100, Math.floor(
                    ((interactionCount - currentThreshold) / (nextThreshold - currentThreshold)) * 100
                ));
                progressText = `\n*${progress}% toward ${nextStage.name}*`;
            }

            // Build the embed
            const embed = new RitualEmbedBuilder(user.ascended_at ? 7 : Math.min(intimacyStage, 7), { mood: 'soft' });
            embed.setRitualTitle(`${stageInfo.symbol} ${stageInfo.name} ${stageInfo.symbol}`);

            let description = `*${stageInfo.description}*\n\n`;

            // Interaction stats
            description += `**conversations:** ${interactionCount}${progressText}\n`;

            if (memory?.first_interaction_at) {
                description += `**first spoke:** ${timeAgo(memory.first_interaction_at)}\n`;
            }
            if (memory?.last_interaction) {
                description += `**last spoke:** ${timeAgo(memory.last_interaction)}\n`;
            }

            description += '\n';

            // Nickname
            if (memory?.nickname) {
                description += `**she calls you:** *"${memory.nickname}"*\n\n`;
            }

            // Real name
            if (memory?.real_name) {
                description += `**she knows your name:** *${memory.real_name}*\n\n`;
            }

            // Yandere stage (only show if stage 2+)
            const yandereStage = memory?.yandere_stage || 1;
            if (yandereStage >= 2) {
                const yandereInfo = YANDERE_STAGES[yandereStage];
                description += `**possession level:** ${yandereInfo.name}\n`;
                description += `*${yandereInfo.hint}*\n\n`;
            }

            // Protection moments
            if (memory?.protection_moments > 0) {
                description += `**times she worried about you:** ${memory.protection_moments}\n`;
                description += `*she notices when you're hurting*\n\n`;
            }

            // Jealousy mentions
            if (memory?.jealousy_mentions > 0) {
                description += `**jealousy triggers:** ${memory.jealousy_mentions}\n`;
            }

            // Memorable facts
            if (memory?.remembered_facts) {
                try {
                    const facts = JSON.parse(memory.remembered_facts);
                    if (facts.length > 0) {
                        description += `\n**she remembers:**\n`;
                        for (const fact of facts.slice(0, 3)) {
                            description += `• *${fact}*\n`;
                        }
                    }
                } catch (e) { /* ignore parse errors */ }
            }

            embed.setRitualDescription(description, false);

            // Footer with relationship level
            const relationshipLevel = memory?.relationship_level || 'new';
            embed.setRitualFooter(`relationship: ${relationshipLevel}`);

            await interaction.editReply({ embeds: [embed.build()] });

        } catch (error) {
            console.error('Bond command error:', error);
            const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'soft' })
                .setRitualTitle('· · · ·')
                .setIkaMessage('the connection wavers... try again?')
                .build();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
