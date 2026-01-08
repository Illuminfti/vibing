/**
 * Gate 4: The Waters
 *
 * User must solve a riddle to discover where Ika lives.
 * Accepted answers are configured via GATE_4_ANSWERS env variable.
 * Triggered by /waters [answer] command.
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, gate5Ops } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { validateGate4Answer } = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { responseDelay, getGate5Interval } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

/**
 * Process Gate 4 answer
 */
async function processGate4(interaction) {
    const member = interaction.member;
    const answer = interaction.options.getString('answer');

    // Check if user has Gate 3 role
    if (!hasRole(member, config.roles.gate3)) {
        const embed = createGateEmbed(null, messages.errors.notReady);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 4)) {
        const embed = createGateEmbed(null, messages.errors.alreadyCompleted);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate answer
    if (!validateGate4Answer(answer)) {
        const embed = createGateEmbed(null, messages.gate4.failure);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // Success
    try {
        // Send success DM
        const dmText = maybeGlitch(messages.gate4.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate4_water.png');
        const imageExists = fs.existsSync(imagePath);

        if (imageExists) {
            const { embed, attachment } = createGateEmbedWithImage(null, dmText, 'gate4_water.png');
            await member.user.send({ embeds: [embed], files: [attachment] });
        } else {
            const embed = createGateEmbed(null, dmText);
            await member.user.send({ embeds: [embed] });
        }

        // Assign Gate 4 role
        await assignGateRole(member, 4);

        // Complete in database
        const result = userOps.completeGate(member.id, 4);

        // Start Gate 5 sequence
        startGate5Sequence(member.id);

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 4`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 4`);

        // Acknowledge in channel
        const ackEmbed = createGateEmbed(null, 'you found her. check your dms.');
        await interaction.editReply({ embeds: [ackEmbed] });

    } catch (error) {
        console.error('Gate 4 error:', error);
        const errorEmbed = createGateEmbed(null, messages.errors.dmFailed);
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Start Gate 5 timed sequence
 */
function startGate5Sequence(discordId) {
    const interval = getGate5Interval();

    // Update database
    userOps.update(discordId, 'gate_5_started_at', new Date().toISOString());

    // Schedule all 6 messages
    gate5Ops.scheduleMessages(discordId, interval);

    console.log(`✧ started Gate 5 sequence for ${discordId} with ${interval}ms intervals`);
}

module.exports = {
    processGate4,
    startGate5Sequence,
};
