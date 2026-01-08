/**
 * /dms Command
 *
 * Allows users to manage their DM preferences.
 * Users must opt-in to receive unprompted DMs from Ika.
 */

const { SlashCommandBuilder } = require('discord.js');
const { dmPrefsOps, dmOps } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dms')
        .setDescription('manage dm preferences')
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('opt into unprompted dms from ika (late night messages, thinking of you, etc.)')
        )
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('opt out of unprompted dms')
        )
        .addSubcommand(sub =>
            sub.setName('status')
                .setDescription('check your dm preferences')
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'enable':
                dmPrefsOps.optIn(userId);

                return interaction.reply({
                    content: `okay. i might dm you sometimes now. late night thoughts. random check-ins. when i'm thinking about you.\n\n...don't make it weird.`,
                    ephemeral: true,
                });

            case 'disable':
                dmPrefsOps.optOut(userId);

                return interaction.reply({
                    content: `okay. i won't dm you out of the blue anymore.\n\n...i'll still be here if you want to talk though.`,
                    ephemeral: true,
                });

            case 'status': {
                const pref = dmPrefsOps.getStatus(userId);
                const dmStatus = dmOps.checkDMStatus(userId);

                const unpromptedEnabled = pref?.unprompted_enabled === 1;
                const canReceiveDMs = !dmStatus.shouldSkip;

                let statusText = '';

                // Unprompted DMs status
                statusText += unpromptedEnabled
                    ? `unprompted dms: **enabled**. i might message you randomly sometimes.`
                    : `unprompted dms: **disabled**. i'll only dm you for gate stuff.`;

                // DM capability status
                if (!canReceiveDMs) {
                    statusText += `\n\n⚠️ note: i can't seem to dm you right now. ${dmStatus.reason || 'check your discord privacy settings.'}`;
                }

                // Show opt-in/out dates if available
                if (pref?.opted_in_at) {
                    const date = new Date(pref.opted_in_at).toLocaleDateString();
                    statusText += `\n\nopted in: ${date}`;
                }

                return interaction.reply({
                    content: statusText,
                    ephemeral: true,
                });
            }

            default:
                return interaction.reply({
                    content: 'unknown subcommand',
                    ephemeral: true,
                });
        }
    },
};
