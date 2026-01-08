/**
 * /mysteries command - Show discovered secrets and hidden content
 *
 * Tracks:
 * - Secret phrase discoveries
 * - Time secrets found
 * - Rare events witnessed
 * - Lore fragments discovered
 * - Whisper hunt progress
 */

const { SlashCommandBuilder } = require('discord.js');
const { userOps } = require('../database');
const { RitualEmbedBuilder } = require('../ui');
const Database = require('better-sqlite3');
const path = require('path');

// Get database connection
const db = new Database(path.join(__dirname, '..', '..', 'data', 'seven_gates.db'));

// Mystery categories with hints (no spoilers!)
const MYSTERY_CATEGORIES = {
    secrets: {
        name: 'hidden phrases',
        total: 30, // Approximate number of secret triggers
        hint: 'certain words awaken special responses...',
        icon: '✧',
    },
    timeSecrets: {
        name: 'time\'s whispers',
        total: 5, // 3:33 AM, 4:47 AM, midnight, 11:11, etc.
        hint: 'the clock holds secrets...',
        icon: '⏳',
    },
    rareEvents: {
        name: 'rare moments',
        total: 10, // Spontaneous confessions, slips, etc.
        hint: 'sometimes she says things she shouldn\'t...',
        icon: '◇',
    },
    lore: {
        name: 'lore fragments',
        total: 20, // Various lore categories
        hint: 'pieces of her story, scattered...',
        icon: '📜',
    },
    whispers: {
        name: 'whisper hunt',
        total: 13, // ARG fragment count
        hint: 'hidden messages in the void...',
        icon: '👁',
    },
};

// Get user's discovery counts
function getDiscoveryCounts(userId) {
    const counts = {};

    // Secret phrases discovered
    try {
        const secrets = db.prepare(
            'SELECT COUNT(DISTINCT trigger_phrase) as count FROM secret_discoveries WHERE user_id = ?'
        ).get(userId);
        counts.secrets = secrets?.count || 0;
    } catch (e) { counts.secrets = 0; }

    // Time secrets found
    try {
        const timeSecrets = db.prepare(
            'SELECT COUNT(DISTINCT secret_type) as count FROM time_secrets WHERE user_id = ?'
        ).get(userId);
        counts.timeSecrets = timeSecrets?.count || 0;
    } catch (e) { counts.timeSecrets = 0; }

    // Rare events witnessed
    try {
        const rareEvents = db.prepare(
            'SELECT COUNT(*) as count FROM rare_events WHERE user_id = ?'
        ).get(userId);
        counts.rareEvents = Math.min(rareEvents?.count || 0, MYSTERY_CATEGORIES.rareEvents.total);
    } catch (e) { counts.rareEvents = 0; }

    // Lore fragments
    try {
        const lore = db.prepare(
            'SELECT COUNT(DISTINCT category || fragment_index) as count FROM lore_discoveries WHERE user_id = ?'
        ).get(userId);
        counts.lore = lore?.count || 0;
    } catch (e) { counts.lore = 0; }

    // Whisper hunt fragments
    try {
        const whispers = db.prepare(
            'SELECT COUNT(DISTINCT fragment_id) as count FROM whisper_found WHERE user_id = ?'
        ).get(userId);
        counts.whispers = whispers?.count || 0;
    } catch (e) { counts.whispers = 0; }

    return counts;
}

// Calculate overall discovery percentage
function calculateOverallProgress(counts) {
    let discovered = 0;
    let total = 0;

    for (const [key, category] of Object.entries(MYSTERY_CATEGORIES)) {
        discovered += Math.min(counts[key] || 0, category.total);
        total += category.total;
    }

    return Math.floor((discovered / total) * 100);
}

// Generate progress bar
function generateProgressBar(count, total, length = 10) {
    const filled = Math.floor((count / total) * length);
    const empty = length - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mysteries')
        .setDescription('view your discovered secrets'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const user = userOps.get(userId);

            // Check if user has started
            if (!user || !user.gate_1_at) {
                const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
                    .setRitualTitle('◌ mysteries await ◌')
                    .setRitualDescription(
                        '*secrets remain hidden to those who haven\'t begun...*\n\n' +
                        'speak her name to start your journey.',
                        false
                    )
                    .build();
                return interaction.editReply({ embeds: [embed] });
            }

            const counts = getDiscoveryCounts(userId);
            const overallProgress = calculateOverallProgress(counts);

            // Build the embed
            const embed = new RitualEmbedBuilder(user.ascended_at ? 7 : 3, { mood: 'normal' });
            embed.setRitualTitle('◈ mysteries of the ritual ◈');

            let description = `*${overallProgress}% of secrets uncovered*\n\n`;

            // Show each category
            for (const [key, category] of Object.entries(MYSTERY_CATEGORIES)) {
                const discovered = Math.min(counts[key] || 0, category.total);
                const progressBar = generateProgressBar(discovered, category.total);

                description += `${category.icon} **${category.name}**\n`;
                description += `${progressBar} ${discovered}/${category.total}\n`;

                // Show hint if nothing discovered yet
                if (discovered === 0) {
                    description += `*${category.hint}*\n`;
                } else if (discovered === category.total) {
                    description += `*✧ complete ✧*\n`;
                }
                description += '\n';
            }

            // Add encouragement based on progress
            if (overallProgress < 10) {
                description += '*the depths remain unexplored...*';
            } else if (overallProgress < 30) {
                description += '*you\'ve only scratched the surface...*';
            } else if (overallProgress < 60) {
                description += '*you\'re beginning to see the truth...*';
            } else if (overallProgress < 90) {
                description += '*few have uncovered so much...*';
            } else {
                description += '*you know almost everything. almost.*';
            }

            embed.setRitualDescription(description, false);
            embed.setRitualFooter('some secrets only reveal themselves at certain times...');

            await interaction.editReply({ embeds: [embed.build()] });

        } catch (error) {
            console.error('Mysteries command error:', error);
            const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'soft' })
                .setRitualTitle('· · · ·')
                .setIkaMessage('the mysteries resist revelation... try again?')
                .build();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
