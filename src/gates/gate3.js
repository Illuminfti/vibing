/**
 * Gate 3: The Confession
 *
 * User must post about Ika publicly and provide proof URL.
 * Triggered by /confess [url] command.
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { isValidUrl, isSocialMediaUrl } = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { responseDelay } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

/**
 * Process Gate 3 confession
 */
async function processGate3(interaction) {
    const member = interaction.member;
    const url = interaction.options.getString('url');

    // Check if user has Gate 2 role
    if (!hasRole(member, config.roles.gate2)) {
        const embed = createGateEmbed(null, messages.errors.notReady);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 3)) {
        const embed = createGateEmbed(null, messages.errors.alreadyCompleted);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate URL (be lenient - accept most valid URLs)
    if (!isValidUrl(url)) {
        const embed = createGateEmbed(null, messages.gate3.invalidUrl);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // Success - send ephemeral message (only visible to user, no DM needed)
    try {
        const dmText = maybeGlitch(messages.gate3.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate3_silhouette.png');
        const imageExists = fs.existsSync(imagePath);

        // Assign Gate 3 role
        await assignGateRole(member, 3);

        // Complete in database
        const result = userOps.completeGate(member.id, 3, { gate_3_url: url });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 3`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 3 with URL: ${url}`);

        // Send success as ephemeral (only user sees it)
        if (imageExists) {
            const { embed, attachment } = createGateEmbedWithImage(null, dmText, 'gate3_silhouette.png');
            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } else {
            const embed = createGateEmbed(null, dmText);
            await interaction.editReply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Gate 3 error:', error);
        const errorEmbed = createGateEmbed(null, messages.errors.generic || 'something went wrong...');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

module.exports = {
    processGate3,
};
