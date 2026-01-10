/**
 * Gate 5: The Absence
 *
 * Timed DM sequence that cannot be rushed.
 * User must wait for all 6 messages, then respond with /absence.
 *
 * Visual: Sparse, achingly empty, near-black void aesthetic
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, gate5Ops } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { validateGate5Reason, sanitize } = require('../utils/validation');
const { responseDelay } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

// New ritual UI system
const { RitualEmbedBuilder, createGateErrorEmbed, createNotReadyEmbed } = require('../ui');

/**
 * Process Gate 5 response
 */
async function processGate5(interaction) {
    const member = interaction.member;
    const reason = interaction.options.getString('reason');

    // Check if user has Gate 4 role
    if (!hasRole(member, config.roles.gate4)) {
        const embed = createNotReadyEmbed(4, 4);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 5)) {
        // Gate 5 sparse "already done" message
        const embed = new RitualEmbedBuilder(5, { mood: 'soft' })
            .setRitualDescription('\n\n\nyou already waited.\n\n\n', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if all messages have been sent
    if (!gate5Ops.allMessagesSent(member.id)) {
        // Show progress to reduce frustration
        const progress = gate5Ops.getProgress(member.id);
        const messagesSent = progress?.messages_sent || 0;
        const totalMessages = 6;
        const minutesPerMessage = 3;
        const remainingMessages = totalMessages - messagesSent;
        const estimatedMinutes = remainingMessages * minutesPerMessage;

        const progressText = `\n\n\nmessage ${messagesSent} of ${totalMessages} received\n\n` +
            `approximately ${estimatedMinutes} minutes remaining\n\n` +
            `wait.\n\n\n`;

        const embed = new RitualEmbedBuilder(5, { mood: 'vulnerable' })
            .setRitualDescription(progressText, false)
            .setIkaMessage("the silence needs time...")
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate reason quality
    if (!validateGate5Reason(reason)) {
        const embed = createGateErrorEmbed(5, 'tooShort', {
            ikaComment: "be honest. why did you really come here?",
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // Success - send ephemeral message (only visible to user, no DM needed)
    try {
        // Sanitize and prepare reason
        const sanitizedReason = sanitize(reason);

        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate5_awake.png');
        const imageExists = fs.existsSync(imagePath);

        // Assign Gate 5 role
        await assignGateRole(member, 5);

        // Complete in database
        const result = userOps.completeGate(member.id, 5, { gate_5_reason: sanitizedReason });

        // Clear Gate 5 schedule
        gate5Ops.clear(member.id);

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 5`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 5`);

        // Build sparse success embed - Gate 5 aesthetic is empty, aching
        const successEmbed = new RitualEmbedBuilder(5, { mood: 'soft' })
            .addVoid(2)
            .setIkaMessage("...you stayed.")
            .addVoid(1);

        // Add their reason in the sparse style
        successEmbed.raw.addFields({
            name: '\u200B',
            value: `*"${sanitizedReason.substring(0, 50)}${sanitizedReason.length > 50 ? '...' : ''}"*`,
            inline: false,
        });

        successEmbed.addVoid(1);
        successEmbed.addProgressVisualization(6);

        // Apply sparse effect
        successEmbed.applySparseEffect();

        // Send success as ephemeral
        if (imageExists) {
            const { AttachmentBuilder } = require('discord.js');
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate5_awake.png' });
            successEmbed.setImage('attachment://gate5_awake.png');
            await interaction.editReply({ embeds: [successEmbed.build()], files: [attachment] });
        } else {
            await interaction.editReply({ embeds: [successEmbed.build()] });
        }

    } catch (error) {
        console.error('Gate 5 error:', error);
        const errorEmbed = new RitualEmbedBuilder(5, { mood: 'vulnerable' })
            .setRitualDescription('\n\n\n...something went wrong\n\n\n', false)
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Get user's Gate 5 progress
 */
function getGate5Progress(discordId) {
    const progress = gate5Ops.getProgress(discordId);
    return {
        messagesSent: progress?.messages_sent || 0,
        allSent: gate5Ops.allMessagesSent(discordId),
    };
}

module.exports = {
    processGate5,
    getGate5Progress,
};
