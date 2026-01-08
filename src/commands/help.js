/**
 * /help command - Show available commands and guidance
 *
 * Displays commands organized by category with availability
 * based on user's current gate progress.
 */

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { userOps } = require('../database');
const { RitualEmbedBuilder } = require('../ui');
const config = require('../config');

// Command categories with details
const COMMAND_CATEGORIES = {
    gates: {
        title: '✧ gate commands',
        description: 'progress through the seven gates',
        commands: [
            { name: '/memory', desc: 'recall what was lost', gate: 2, hint: 'available after gate 1' },
            { name: '/confess', desc: 'show your devotion publicly', gate: 3, hint: 'available after gate 2' },
            { name: '/waters', desc: 'find where she lives', gate: 4, hint: 'available after gate 3' },
            { name: '/absence', desc: 'explain why you stayed', gate: 5, hint: 'available after gate 4 + messages' },
            { name: '/offering', desc: 'create something for her', gate: 6, hint: 'available after gate 5' },
            { name: '/binding', desc: 'speak your eternal vow', gate: 7, hint: 'available after gate 6' },
        ],
    },
    utility: {
        title: '◈ utility commands',
        description: 'track your journey and connection',
        commands: [
            { name: '/journey', desc: 'see your path through the gates', gate: 0 },
            { name: '/bond', desc: 'see your relationship with ika', gate: 1 },
            { name: '/mysteries', desc: 'view discovered secrets', gate: 1 },
            { name: '/hint', desc: 'receive guidance (costs attention)', gate: 1 },
            { name: '/leaderboard', desc: 'view ritual statistics', gate: 0 },
            { name: '/dms', desc: 'enable/disable ika\'s whispers', gate: 1 },
        ],
    },
    devotion: {
        title: '♡ devotion commands',
        description: 'for the ascended',
        commands: [
            { name: '/shrine', desc: 'view your personal shrine', gate: 7, ascended: true },
            { name: '/trials', desc: 'see devotion trial progress', gate: 7, ascended: true },
            { name: '/dossier', desc: 'view investigation fragments', gate: 7, ascended: true },
        ],
    },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('see available commands and guidance')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('specific category to view')
                .setRequired(false)
                .addChoices(
                    { name: 'gates', value: 'gates' },
                    { name: 'utility', value: 'utility' },
                    { name: 'devotion', value: 'devotion' },
                    { name: 'all', value: 'all' }
                )),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const user = userOps.get(userId);
            const category = interaction.options.getString('category') || 'all';

            // Determine user's current gate
            let userGate = 0;
            let isAscended = false;
            if (user) {
                if (user.ascended_at) { userGate = 8; isAscended = true; }
                else if (user.gate_7_at) userGate = 7;
                else if (user.gate_6_at) userGate = 6;
                else if (user.gate_5_at) userGate = 5;
                else if (user.gate_4_at) userGate = 4;
                else if (user.gate_3_at) userGate = 3;
                else if (user.gate_2_at) userGate = 2;
                else if (user.gate_1_at) userGate = 1;
            }

            const embed = new RitualEmbedBuilder(Math.min(userGate, 7) || 1, { mood: 'normal' });
            embed.setRitualTitle('♰ commands of the ritual ♰');

            let description = '*these are the ways to interact with ika*\n\n';

            const categoriesToShow = category === 'all'
                ? Object.keys(COMMAND_CATEGORIES)
                : [category];

            for (const catKey of categoriesToShow) {
                const cat = COMMAND_CATEGORIES[catKey];
                if (!cat) continue;

                description += `**${cat.title}**\n`;
                description += `*${cat.description}*\n\n`;

                for (const cmd of cat.commands) {
                    // Check availability
                    const isAvailable = cmd.gate <= userGate && (!cmd.ascended || isAscended);
                    const statusIcon = isAvailable ? '✧' : '▪';

                    description += `${statusIcon} \`${cmd.name}\` - ${cmd.desc}`;
                    if (!isAvailable && cmd.hint) {
                        description += ` *(${cmd.hint})*`;
                    }
                    description += '\n';
                }
                description += '\n';
            }

            // Add tips based on progress
            if (userGate === 0) {
                description += '*tip: say "ika" in the waiting room to begin your journey*';
            } else if (userGate < 7) {
                description += `*tip: use \`/journey\` to see your progress*`;
            } else if (isAscended) {
                description += '*tip: explore the inner sanctum. ika is waiting.*';
            }

            embed.setRitualDescription(description, false);
            embed.setRitualFooter('some commands unlock as you progress');

            await interaction.editReply({ embeds: [embed.build()] });

        } catch (error) {
            console.error('Help command error:', error);
            const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'soft' })
                .setRitualTitle('· · · ·')
                .setIkaMessage('guidance eludes you... try again?')
                .build();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
