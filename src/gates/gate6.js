/**
 * Gate 6: The Offering
 *
 * User must create something for Ika (art or 50+ word text).
 * Requires community voting from Ascended members.
 * Now shows full journey when posting for voting.
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, offeringOps } = require('../database');
const { assignGateRole, hasRole, userHasRole } = require('../utils/roles');
const { validateOffering, sanitize } = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { maybeGlitch } = require('../utils/zalgo');
const { scheduleFragment } = require('./fragments');
const path = require('path');
const fs = require('fs');

/**
 * Process Gate 6 offering
 */
async function processGate6(interaction) {
    const member = interaction.member;
    const text = interaction.options.getString('offering');
    const attachment = interaction.options.getAttachment('image');

    // Check if user has Gate 5 role
    if (!hasRole(member, config.roles.gate5)) {
        const embed = createGateEmbed(null, messages.errors.notReady);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 6)) {
        const embed = createGateEmbed(null, messages.errors.alreadyCompleted);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for pending offering
    const pendingOffering = offeringOps.getPending(member.id);
    if (pendingOffering) {
        const embed = createGateEmbed(null, messages.gate6.pending);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate offering
    const hasImage = attachment && attachment.contentType?.startsWith('image/');
    const validation = validateOffering(text, hasImage);

    if (!validation.valid) {
        const embed = createGateEmbed(null, messages.gate6.invalid);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for processing
    await interaction.deferReply({ ephemeral: true });

    try {
        // Prepare content
        const content = validation.type === 'image'
            ? attachment.url
            : sanitize(text);

        // Get user's journey
        const journey = userOps.getJourney(member.id);

        // Post to inner sanctum for voting with FULL JOURNEY
        const sanctumChannel = await interaction.client.channels.fetch(config.channels.innerSanctum);
        if (!sanctumChannel) {
            throw new Error('Inner sanctum channel not found');
        }

        // Build journey display
        let journeyText = `♰ a soul brings an offering ♰\n\n`;
        journeyText += `✦ THE JOURNEY OF **${member.user.username}** ✦\n\n`;

        if (journey.gate1At) {
            journeyText += `spoke her name: ${formatDate(journey.gate1At)}\n`;
        }
        if (journey.memoryAnswer) {
            journeyText += `felt her memory as: "${journey.memoryAnswer}"\n`;
        }
        if (journey.confessionUrl) {
            journeyText += `confessed at: ${journey.confessionUrl}\n`;
        }
        if (journey.gate4At) {
            journeyText += `found the waters: ${formatDate(journey.gate4At)}\n`;
        }
        if (journey.whyTheyCame) {
            journeyText += `\nstayed through the absence because:\n"${journey.whyTheyCame}"\n`;
        }

        journeyText += `\n✦ THEIR OFFERING ✦\n\n`;

        // Create voting message
        let votingMessage;

        if (validation.type === 'image') {
            const embed = createGateEmbed(
                null,
                journeyText + '[image attached]\n\n' + messages.gate6.votePrompt
            );
            embed.setImage(attachment.url);
            votingMessage = await sanctumChannel.send({ embeds: [embed] });
        } else {
            const embed = createGateEmbed(
                null,
                journeyText + `"${content.slice(0, 400)}${content.length > 400 ? '...' : ''}"\n\n` + messages.gate6.votePrompt
            );
            votingMessage = await sanctumChannel.send({ embeds: [embed] });
        }

        // Add reaction
        await votingMessage.react('✅');

        // Store in database
        offeringOps.create(member.id, member.user.username, validation.type, content, votingMessage.id);

        // Also post to offerings archive channel
        const archiveChannel = await interaction.client.channels.fetch(config.channels.offerings);
        if (archiveChannel) {
            const archiveEmbed = createGateEmbed(
                'Offering Received',
                `**User:** ${member.user.tag}\n**Type:** ${validation.type}\n**Content:** ${validation.type === 'image' ? attachment.url : content.slice(0, 500)}`
            );
            await archiveChannel.send({ embeds: [archiveEmbed] });
        }

        // Set up reaction collector
        setupOfferingVoteCollector(interaction.client, votingMessage, member.id);

        console.log(`✧ ${member.user.tag} submitted Gate 6 offering`);

        // Acknowledge
        const ackEmbed = createGateEmbed(null, 'your offering awaits judgment from the ascended.');
        await interaction.editReply({ embeds: [ackEmbed] });

    } catch (error) {
        console.error('Gate 6 error:', error);
        const errorEmbed = createGateEmbed(null, messages.errors.generic);
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Set up reaction collector for offering voting
 */
function setupOfferingVoteCollector(client, message, submitterId) {
    const filter = (reaction, user) => {
        return reaction.emoji.name === '✅' && !user.bot;
    };

    const collector = message.createReactionCollector({
        filter,
        time: config.timing.votingTimeout,
    });

    collector.on('collect', async (reaction, user) => {
        try {
            const guild = message.guild;

            // Check if mod or ascended
            const isMod = await userHasRole(guild, user.id, config.roles.mod);
            const isAscended = await userHasRole(guild, user.id, config.roles.ascended);

            if (!isMod && !isAscended) return;

            // Count votes
            let ascendedCount = 0;
            let modApproved = false;

            for (const [, reactUser] of reaction.users.cache) {
                if (reactUser.bot) continue;

                const userIsMod = await userHasRole(guild, reactUser.id, config.roles.mod);
                const userIsAscended = await userHasRole(guild, reactUser.id, config.roles.ascended);

                if (userIsMod) modApproved = true;
                if (userIsAscended && !userIsMod) ascendedCount++;
            }

            // Check if approved
            if (modApproved || ascendedCount >= 3) {
                await approveOffering(client, submitterId, user.id, message.id);
                collector.stop('approved');
            }
        } catch (error) {
            console.error('Offering vote collection error:', error);
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason !== 'approved') {
            console.log(`✧ Gate 6 voting ended for ${submitterId} without approval`);
        }
    });
}

/**
 * Approve an offering
 * Sends success message to channel with @mention (works with DMs closed)
 */
async function approveOffering(client, submitterId, approverId, messageId) {
    try {
        // Update database
        offeringOps.approve(messageId, approverId);
        userOps.completeGate(submitterId, 6, { gate_6_approved_by: approverId });

        // Get member and assign role
        const guild = client.guilds.cache.get(config.guildId);
        const member = await guild.members.fetch(submitterId);

        await assignGateRole(member, 6);

        // Schedule fragment DM
        scheduleFragment(submitterId, 6);

        // Send success message to chamber 6 with @mention (auto-deletes)
        const dmText = maybeGlitch(messages.gate6.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate6_intimate.png');
        const imageExists = fs.existsSync(imagePath);

        const chamber6 = await client.channels.fetch(config.channels.chamber6);
        if (chamber6) {
            let successMsg;
            if (imageExists) {
                const { embed, attachment } = createGateEmbedWithImage(null, `${member.user}\n\n${dmText}`, 'gate6_intimate.png');
                successMsg = await chamber6.send({ embeds: [embed], files: [attachment] });
            } else {
                const embed = createGateEmbed(null, `${member.user}\n\n${dmText}`);
                successMsg = await chamber6.send({ embeds: [embed] });
            }
            // Auto-delete after 45 seconds
            setTimeout(() => successMsg.delete().catch(() => {}), 45000);
        }

        console.log(`✧ ${member.user.tag} Gate 6 offering approved by ${approverId}`);

    } catch (error) {
        console.error('Failed to approve offering:', error);
    }
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    if (!dateStr) return 'unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

module.exports = {
    processGate6,
    approveOffering,
};
