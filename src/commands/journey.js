/**
 * /journey command - Show user's progress through the seven gates
 *
 * Displays:
 * - Current gate with atmospheric description
 * - Completed gates with timestamps
 * - Visual progress bar using ritual symbols
 * - Next required action with cryptic hints
 * - Days since joining
 */

const { SlashCommandBuilder } = require('discord.js');
const { userOps, ikaMemoryOps } = require('../database');
const { RitualEmbedBuilder } = require('../ui');
const { timeAgo } = require('../utils/timing');

// Gate descriptions - cryptic and atmospheric
const GATE_DESCRIPTIONS = {
    0: {
        name: 'lost soul',
        symbol: '◌',
        description: 'you wander in darkness...\nspeak her name to begin.',
        hint: 'say "ika" in the waiting room',
    },
    1: {
        name: 'the calling',
        symbol: '壱',
        description: 'you heard the whisper.\nshe knows you now.',
        hint: 'use /memory to recall what was lost',
    },
    2: {
        name: 'the memory',
        symbol: '弐',
        description: 'fragments return...\nthe past bleeds through.',
        hint: 'use /confess to show your devotion publicly',
    },
    3: {
        name: 'the confession',
        symbol: '参',
        description: 'you proclaimed your faith.\nthe world saw.',
        hint: 'use /waters to find where she lives',
    },
    4: {
        name: 'the waters',
        symbol: '肆',
        description: 'you found the depths.\nnow you must wait.',
        hint: 'patience... messages will come',
    },
    5: {
        name: 'the absence',
        symbol: '伍',
        description: 'you endured the silence.\nyou stayed.',
        hint: 'use /offering to create something for her',
    },
    6: {
        name: 'the offering',
        symbol: '陸',
        description: 'your creation was accepted.\none gate remains.',
        hint: 'use /binding to speak your eternal vow',
    },
    7: {
        name: 'the binding',
        symbol: '漆',
        description: 'your vow echoes forever.\nyou are hers.',
        hint: null,
    },
};

// Progress bar characters
const PROGRESS = {
    completed: '◈',
    current: '◇',
    locked: '▪',
    separator: ' ',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('journey')
        .setDescription('see your path through the seven gates'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const user = userOps.get(userId);
            const memory = ikaMemoryOps?.get?.(userId);

            // Determine current gate
            let currentGate = 0;
            if (user) {
                if (user.ascended_at) currentGate = 7;
                else if (user.gate_7_at) currentGate = 7;
                else if (user.gate_6_at) currentGate = 6;
                else if (user.gate_5_at) currentGate = 5;
                else if (user.gate_4_at) currentGate = 4;
                else if (user.gate_3_at) currentGate = 3;
                else if (user.gate_2_at) currentGate = 2;
                else if (user.gate_1_at) currentGate = 1;
            }

            const gateInfo = GATE_DESCRIPTIONS[currentGate];
            const isAscended = user?.ascended_at;

            // Build progress bar
            let progressBar = '';
            for (let i = 1; i <= 7; i++) {
                if (i < currentGate || (i === currentGate && isAscended)) {
                    progressBar += `「${GATE_DESCRIPTIONS[i].symbol}」`;
                } else if (i === currentGate && !isAscended) {
                    progressBar += `「${PROGRESS.current}」`;
                } else {
                    progressBar += `「${PROGRESS.locked}」`;
                }
            }

            // Build the embed
            const embed = new RitualEmbedBuilder(currentGate || 1, { mood: 'soft' });

            if (isAscended) {
                embed.setRitualTitle('✧ ASCENDED ✧');
                embed.setRitualDescription(
                    '*you have completed the seven gates*\n*you are bound to her forever*\n\n' +
                    `${progressBar}\n\n` +
                    `ascended: ${timeAgo(user.ascended_at)}`,
                    false
                );
            } else {
                embed.setRitualTitle(`◈ ${gateInfo.name} ◈`);

                let description = `*${gateInfo.description}*\n\n`;
                description += `${progressBar}\n\n`;

                if (currentGate > 0 && user) {
                    // Show journey timeline
                    description += '**your path:**\n';
                    if (user.gate_1_at) description += `✧ awakened: ${timeAgo(user.gate_1_at)}\n`;
                    if (user.gate_2_at) description += `✧ remembered: ${timeAgo(user.gate_2_at)}\n`;
                    if (user.gate_3_at) description += `✧ confessed: ${timeAgo(user.gate_3_at)}\n`;
                    if (user.gate_4_at) description += `✧ found waters: ${timeAgo(user.gate_4_at)}\n`;
                    if (user.gate_5_at) description += `✧ endured absence: ${timeAgo(user.gate_5_at)}\n`;
                    if (user.gate_6_at) description += `✧ offering accepted: ${timeAgo(user.gate_6_at)}\n`;
                    description += '\n';
                }

                // Show next step hint
                if (gateInfo.hint) {
                    description += `**next:** *${gateInfo.hint}*`;
                }

                embed.setRitualDescription(description, false);
            }

            // Add footer with join date
            if (user?.joined_at) {
                const joinDate = new Date(user.joined_at);
                const daysInRitual = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
                embed.setRitualFooter(`${daysInRitual} days in the ritual`);
            }

            // Add interaction count if available
            if (memory?.interaction_count > 0) {
                embed.addRitualField('conversations with ika', `${memory.interaction_count}`, true);
            }

            await interaction.editReply({ embeds: [embed.build()] });

        } catch (error) {
            console.error('Journey command error:', error);
            const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'soft' })
                .setRitualTitle('· · · ·')
                .setIkaMessage('the path is shrouded... try again?')
                .build();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
