/**
 * Gate 2: The Memory
 *
 * User must provide a word that describes what attention felt like.
 * Triggered by /memory [answer] command.
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { validateGate2Answer } = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { responseDelay } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

/**
 * Process Gate 2 answer
 */
async function processGate2(interaction) {
    const member = interaction.member;
    const answer = interaction.options.getString('answer');

    // Check if user has Gate 1 role
    if (!hasRole(member, config.roles.gate1)) {
        const embed = createGateEmbed(null, messages.errors.notReady);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 2)) {
        const embed = createGateEmbed(null, messages.errors.alreadyCompleted);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate answer
    if (!validateGate2Answer(answer)) {
        const embed = createGateEmbed(null, messages.gate2.failure);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // Success - send ephemeral message (only visible to user, no DM needed)
    try {
        const dmText = maybeGlitch(messages.gate2.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate2_lips.png');
        const imageExists = fs.existsSync(imagePath);

        // Assign Gate 2 role
        await assignGateRole(member, 2);

        // Complete in database
        const result = userOps.completeGate(member.id, 2, { gate_2_answer: answer });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 2`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 2 with answer: ${answer}`);

        // Send success as ephemeral (only user sees it)
        if (imageExists) {
            const { embed, attachment } = createGateEmbedWithImage(null, dmText, 'gate2_lips.png');
            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } else {
            const embed = createGateEmbed(null, dmText);
            await interaction.editReply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Gate 2 error:', error);
        const errorEmbed = createGateEmbed(null, messages.errors.generic || 'something went wrong...');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

module.exports = {
    processGate2,
};
