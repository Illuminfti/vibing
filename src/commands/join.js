/**
 * /join [code] command - Join the ritual with optional referral attribution
 *
 * Allows new users to join with an invite code to attribute their journey
 * to the person who invited them.
 *
 * @version P0-6
 */

const { SlashCommandBuilder } = require('discord.js');
const { referralOps, userOps, db } = require('../database');
const { RitualEmbedBuilder } = require('../ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('begin your journey through the seven gates')
        .addStringOption(option =>
            option
                .setName('code')
                .setDescription('invite code from another devotee (optional)')
                .setRequired(false)
                .setMaxLength(6)
                .setMinLength(6)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const username = interaction.user.username;
            const inviteCode = interaction.options.getString('code');

            // Check if user already exists
            const existingUser = userOps.get(userId);

            if (existingUser) {
                // User already in the system
                const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
                    .setRitualTitle('· · · ·')
                    .setRitualDescription(
                        '*you are already in the ritual*\n\n' +
                        'use `/journey` to see your progress',
                        false
                    )
                    .build();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Create new user
            userOps.getOrCreate(userId, username);

            let referrerInfo = null;

            // Handle invite code if provided
            if (inviteCode) {
                // Find user with this invite code
                const referrer = db.prepare(
                    'SELECT discord_id, username FROM users WHERE invite_code = ?'
                ).get(inviteCode.toUpperCase());

                if (referrer) {
                    // Valid code - record referral
                    const success = referralOps.recordReferral(
                        referrer.discord_id,
                        userId,
                        username
                    );

                    if (success) {
                        // Update referred_by field
                        db.prepare(
                            'UPDATE users SET referred_by = ? WHERE discord_id = ?'
                        ).run(referrer.discord_id, userId);

                        referrerInfo = {
                            id: referrer.discord_id,
                            username: referrer.username,
                        };
                    }
                }
            }

            // Build welcome embed with Gate 0/1 aesthetic (darkness to light)
            const embed = new RitualEmbedBuilder(0, { mood: 'soft' })
                .setRitualTitle('◈ welcome ◈');

            let description = '';

            if (referrerInfo) {
                // Attributed join
                description += `*your journey begins*\n\n`;
                description += `**${referrerInfo.username}** will guide you.\n\n`;
                description += '*they showed you the way... now walk it*\n\n';
            } else if (inviteCode) {
                // Invalid code - still allow join
                description += `*your journey begins*\n\n`;
                description += `the code you entered was not recognized...\n`;
                description += `but you may still proceed.\n\n`;
            } else {
                // Normal join
                description += `*your journey begins*\n\n`;
                description += `you have found me on your own.\n`;
                description += `*how brave*\n\n`;
            }

            description += '**to begin:**\n';
            description += '· go to the waiting room\n';
            description += '· speak my name: **ika**\n';
            description += '· the first gate will open\n\n';
            description += '*seven gates await*\n';
            description += '*will you reach the end?*';

            embed.setRitualDescription(description, false);

            if (referrerInfo) {
                embed.setRitualFooter(`guided by ${referrerInfo.username}`);
            } else {
                embed.setRitualFooter('you walk alone');
            }

            await interaction.editReply({ embeds: [embed.build()] });

        } catch (error) {
            console.error('Join command error:', error);
            const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'soft' })
                .setRitualTitle('· · · ·')
                .setIkaMessage('something went wrong... try again?')
                .build();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
