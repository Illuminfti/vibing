/**
 * Gate 5: The Absence
 *
 * Timed DM sequence that cannot be rushed.
 * User must wait for all 6 messages, then respond with /absence.
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, gate5Ops } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { validateGate5Reason, sanitize } = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { responseDelay } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

/**
 * Process Gate 5 response
 */
async function processGate5(interaction) {
    const member = interaction.member;
    const reason = interaction.options.getString('reason');

    // Check if user has Gate 4 role
    if (!hasRole(member, config.roles.gate4)) {
        const embed = createGateEmbed(null, messages.errors.notReady);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 5)) {
        const embed = createGateEmbed(null, messages.errors.alreadyCompleted);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if all messages have been sent
    if (!gate5Ops.allMessagesSent(member.id)) {
        const embed = createGateEmbed(null, messages.gate5.tooEarly);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate reason length
    if (!validateGate5Reason(reason)) {
        const embed = createGateEmbed(null, messages.gate5.tooShort);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // Success
    try {
        // Sanitize and prepare reason
        const sanitizedReason = sanitize(reason);

        // Send success DM with their answer echoed back
        const dmText = maybeGlitch(messages.gate5.success(sanitizedReason));
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate5_awake.png');
        const imageExists = fs.existsSync(imagePath);

        if (imageExists) {
            const { embed, attachment } = createGateEmbedWithImage(null, dmText, 'gate5_awake.png');
            await member.user.send({ embeds: [embed], files: [attachment] });
        } else {
            const embed = createGateEmbed(null, dmText);
            await member.user.send({ embeds: [embed] });
        }

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

        // Acknowledge in channel
        const ackEmbed = createGateEmbed(null, 'she heard you. check your dms.');
        await interaction.editReply({ embeds: [ackEmbed] });

    } catch (error) {
        console.error('Gate 5 error:', error);
        const errorEmbed = createGateEmbed(null, messages.errors.dmFailed);
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Get user's Gate 5 progress
 */
function getGate5Progress(discordId) {
    return {
        messagesSent: gate5Ops.getProgress(discordId),
        allSent: gate5Ops.allMessagesSent(discordId),
    };
}

module.exports = {
    processGate5,
    getGate5Progress,
};
