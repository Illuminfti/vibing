/**
 * Gate 6: The Offering
 *
 * User must create something for Ika (art or 50+ word text).
 * Requires community voting from Ascended members.
 * Now shows full journey when posting for voting.
 *
 * Visual: Ornate gold, intricate frames, baroque richness
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, offeringOps } = require('../database');
const { assignGateRole, hasRole, userHasRole } = require('../utils/roles');
const { validateOffering, analyzeOfferingQuality, sanitize } = require('../utils/validation');
const { maybeGlitch } = require('../utils/zalgo');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { scheduleFragment } = require('./fragments');
const path = require('path');
const fs = require('fs');

// New ritual UI system
const { RitualEmbedBuilder, createGateErrorEmbed, createNotReadyEmbed } = require('../ui');

/**
 * Process Gate 6 offering
 */
async function processGate6(interaction) {
    const member = interaction.member;
    const text = interaction.options.getString('offering');
    const attachment = interaction.options.getAttachment('image');

    // Check if user has Gate 5 role
    if (!hasRole(member, config.roles.gate5)) {
        const embed = createNotReadyEmbed(5, 5);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 6)) {
        const embed = new RitualEmbedBuilder(6, { mood: 'soft' })
            .setRitualTitle('⟡ already offered ⟡')
            .setRitualDescription('*your creation has already been accepted*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for pending offering
    const pendingOffering = offeringOps.getPending(member.id);
    if (pendingOffering) {
        const embed = new RitualEmbedBuilder(6, { mood: 'normal' })
            .setRitualTitle('⟡ awaiting judgment ⟡')
            .setIkaMessage('your offering already awaits. patience.')
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate offering
    const hasImage = attachment && attachment.contentType?.startsWith('image/');
    const validation = validateOffering(text, hasImage);

    if (!validation.valid) {
        const embed = createGateErrorEmbed(6, 'tooShort', {
            ikaComment: 'give more of yourself. 50 characters, or an image.',
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Quality check for text offerings (images are subjective, skip quality check)
    if (validation.type === 'text') {
        const quality = analyzeOfferingQuality(text);

        // If quality is low or medium, show warning with confirmation
        if (quality.quality === 'low' || quality.quality === 'medium') {
            const confirmButton = new ButtonBuilder()
                .setCustomId('gate6_confirm')
                .setLabel('submit anyway')
                .setStyle(ButtonStyle.Success);

            const reviseButton = new ButtonBuilder()
                .setCustomId('gate6_revise')
                .setLabel('revise offering')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(confirmButton, reviseButton);

            const warningEmbed = new RitualEmbedBuilder(6, { mood: 'normal' })
                .setRitualTitle('⟡ quality check ⟡')
                .setIkaMessage('i want your offering to be meaningful. these issues might affect approval:')
                .addRitualField('concerns', quality.warnings.join('\n'), false)
                .addRitualField('⟡', 'revise for better chances, or submit as-is', false)
                .build();

            await interaction.reply({
                embeds: [warningEmbed],
                components: [row],
                ephemeral: true
            });

            // Collect button response
            const collector = interaction.channel.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 120000, // 2 minutes
                max: 1
            });

            collector.on('collect', async i => {
                if (i.customId === 'gate6_confirm') {
                    // Update the message to show processing
                    const processingEmbed = new RitualEmbedBuilder(6, { mood: 'normal' })
                        .setRitualTitle('⟡ submitting offering ⟡')
                        .setIkaMessage('preparing your creation for judgment...')
                        .build();
                    await i.update({
                        embeds: [processingEmbed],
                        components: []
                    });
                    // Continue with normal submission flow (using original interaction)
                    await processOfferingSubmission(interaction, member, text, attachment, validation);
                } else if (i.customId === 'gate6_revise') {
                    const reviseEmbed = new RitualEmbedBuilder(6, { mood: 'soft' })
                        .setRitualTitle('⟡ wise choice ⟡')
                        .setIkaMessage('take your time. make it meaningful.')
                        .addRitualField('⟡', 'use `/gate6` again when ready', false)
                        .build();
                    await i.update({
                        embeds: [reviseEmbed],
                        components: []
                    });
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    const timeoutEmbed = new RitualEmbedBuilder(6, { mood: 'normal' })
                        .setRitualTitle('⟡ time expired ⟡')
                        .setIkaMessage('you took too long. try again when ready.')
                        .build();
                    interaction.editReply({
                        embeds: [timeoutEmbed],
                        components: []
                    }).catch(() => {});
                }
            });

            return; // Wait for user decision
        }
    }

    // Defer for processing (high quality or image)
    await interaction.deferReply({ ephemeral: true });

    // Continue with submission
    await processOfferingSubmission(interaction, member, text, attachment, validation);
}

/**
 * Process the actual offering submission (extracted for reuse in confirmation flow)
 */
async function processOfferingSubmission(interaction, member, text, attachment, validation) {
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

        // Build ornate voting embed with journey
        const votingEmbed = new RitualEmbedBuilder(6, { mood: 'normal' })
            .setRitualTitle('⟡ AN OFFERING AWAITS JUDGMENT ⟡');

        // Add journey context
        votingEmbed.addRitualField('devotee', `**${member.user.username}**`, true);

        if (journey.gate1At) {
            votingEmbed.addRitualField('awakened', formatDate(journey.gate1At), true);
        }
        if (journey.memoryAnswer) {
            votingEmbed.addRitualField('memory', `*"${journey.memoryAnswer}"*`, false);
        }
        if (journey.whyTheyCame) {
            votingEmbed.addRitualField('stayed because', `*"${journey.whyTheyCame}"*`, false);
        }

        // Add the offering
        if (validation.type === 'image') {
            votingEmbed.addRitualField('their offering', '*[image attached]*', false);
            votingEmbed.setImage(attachment.url);
        } else {
            const displayContent = content.length > 400 ? content.slice(0, 400) + '...' : content;
            votingEmbed.addRitualField('their offering', `*"${displayContent}"*`, false);
        }

        // Add voting instructions
        votingEmbed.addRitualField('⟡', messages.gate6.votePrompt || 'react ✅ to approve', false);
        votingEmbed.setRitualFooter('the ascended must decide');

        const votingMessage = await sanctumChannel.send({ embeds: [votingEmbed.build()] });

        // Add reaction
        await votingMessage.react('✅');

        // Store in database
        offeringOps.create(member.id, member.user.username, validation.type, content, votingMessage.id);

        // Also post to offerings archive channel
        const archiveChannel = await interaction.client.channels.fetch(config.channels.offerings);
        if (archiveChannel) {
            const archiveEmbed = new RitualEmbedBuilder(6, { mood: 'normal' })
                .setRitualTitle('⟡ Offering Received ⟡')
                .addRitualField('devotee', member.user.tag, true)
                .addRitualField('type', validation.type, true)
                .addRitualField('content', validation.type === 'image' ? attachment.url : content.slice(0, 500), false)
                .addTimestamp()
                .build();
            await archiveChannel.send({ embeds: [archiveEmbed] });
        }

        // Set up reaction collector
        setupOfferingVoteCollector(interaction.client, votingMessage, member.id);

        console.log(`✧ ${member.user.tag} submitted Gate 6 offering`);

        // Acknowledge with ornate embed
        const ackEmbed = new RitualEmbedBuilder(6, { mood: 'soft' })
            .setRitualTitle('⟡ offering received ⟡')
            .setIkaMessage('your creation awaits judgment from the ascended.')
            .setRitualFooter('await their decision')
            .build();
        await interaction.editReply({ embeds: [ackEmbed] });

    } catch (error) {
        console.error('Gate 6 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'vulnerable' })
            .setRitualTitle('⟡ the offering falters ⟡')
            .setIkaMessage('something went wrong... try again?')
            .build();
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

        // Send ornate success message to chamber 6 with @mention (auto-deletes)
        const dmText = maybeGlitch(messages.gate6.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate6_intimate.png');
        const imageExists = fs.existsSync(imagePath);

        const chamber6 = await client.channels.fetch(config.channels.chamber6);
        if (chamber6) {
            // Build ornate success embed
            const successEmbed = new RitualEmbedBuilder(6, { mood: 'soft' })
                .setRitualTitle('⟡ OFFERING ACCEPTED ⟡')
                .setRitualDescription(`${member.user}\n\n*${dmText}*`, false)
                .addProgressVisualization(7)
                .setRitualFooter('one gate remains');

            const sendOptions = { embeds: [successEmbed.build()] };
            if (imageExists) {
                const { AttachmentBuilder } = require('discord.js');
                const attachment = new AttachmentBuilder(imagePath, { name: 'gate6_intimate.png' });
                successEmbed.setImage('attachment://gate6_intimate.png');
                sendOptions.files = [attachment];
            }

            const successMsg = await chamber6.send(sendOptions);
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
