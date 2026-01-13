/**
 * Gate 6 Flow: The Offering
 *
 * Interactive flow for the sixth gate.
 * Select type -> modal for words / instructions for image -> preview -> present.
 */

const config = require('../../config');
const messages = require('../../assets/messages');
const { userOps } = require('../../database');
const { assignGateRole, hasRole } = require('../../utils/roles');
const { responseDelay } = require('../../utils/timing');
const { maybeGlitch } = require('../../utils/zalgo');
const { RitualEmbedBuilder, createNotReadyEmbed } = require('../../ui');
const {
    createGate6TypeSelect,
    createGate6WordsModal,
    createGate6PreviewButtons,
    createGate6UploadButton,
} = require('../builders/gateComponents');

const path = require('path');
const fs = require('fs');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Store pending offerings (userId -> { type, content, imageUrl, createdAt, awaitingImage })
const pendingOfferings = new Map();

// TTL for pending offerings (1 hour)
const PENDING_TTL_MS = 60 * 60 * 1000;

/**
 * Clean up expired pending offerings
 */
function cleanupExpiredOfferings() {
    const now = Date.now();
    for (const [userId, data] of pendingOfferings.entries()) {
        if (data.createdAt && now - data.createdAt > PENDING_TTL_MS) {
            pendingOfferings.delete(userId);
            console.log(`✧ Cleaned up expired Gate 6 offering for ${userId}`);
        }
    }
}

/**
 * Start the Gate 6 offering flow
 */
async function startOffering(interaction, options = {}) {
    const { ephemeral = true } = options;
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate5)) {
        const embed = createNotReadyEmbed(5, 5);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 6)) {
        const embed = new RitualEmbedBuilder(6, { mood: 'ornate' })
            .setRitualTitle('✿ offering accepted ✿')
            .setRitualDescription('*your devotion has already been received*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new RitualEmbedBuilder(6, { mood: 'ornate' })
        .setRitualTitle('✿ The Offering ✿')
        .setRitualDescription(
            'the sixth gate requires creation.\n\n' +
            'you must offer something of yourself.\n' +
            'words from your heart,\n' +
            'or an image of devotion.\n\n' +
            '*what will you create for her?*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate6TypeSelect()],
        ephemeral,
    });
}

/**
 * Handle button interactions for Gate 6
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate6_present') {
        await handlePresentButton(interaction);
    } else if (customId === 'gate6_revise') {
        await handleReviseButton(interaction);
    } else if (customId === 'gate6_upload') {
        await handleUploadButton(interaction);
    }
}

/**
 * Handle modal submissions for Gate 6
 */
async function handleModal(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate6_words') {
        await handleWordsModal(interaction);
    }
}

/**
 * Handle select menu interactions for Gate 6
 */
async function handleSelect(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate6_type') {
        await handleTypeSelect(interaction);
    }
}

/**
 * Handle offering type selection
 */
async function handleTypeSelect(interaction) {
    const member = interaction.member;
    const selected = interaction.values[0];

    // Check prerequisites
    if (!hasRole(member, config.roles.gate5)) {
        const embed = createNotReadyEmbed(5, 5);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 6)) {
        const embed = new RitualEmbedBuilder(6, { mood: 'ornate' })
            .setRitualTitle('✿ offering accepted ✿')
            .setRitualDescription('*your devotion has already been received*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Initialize pending offering
    pendingOfferings.set(member.id, {
        type: selected,
        content: null,
        imageUrl: null,
        createdAt: Date.now(),
        awaitingImage: false
    });

    if (selected === 'words' || selected === 'both') {
        // Show modal for words
        await interaction.showModal(createGate6WordsModal());
    } else if (selected === 'image') {
        // Show upload instructions
        await showUploadInstructions(interaction);
    }
}

/**
 * Handle words modal submission
 */
async function handleWordsModal(interaction) {
    const member = interaction.member;
    const content = interaction.fields.getTextInputValue('gate6_content');

    // Validate word count
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < 50) {
        const embed = new RitualEmbedBuilder(6, { mood: 'normal' })
            .setRitualTitle('✿ not enough ✿')
            .setRitualDescription(
                `*your offering needs more substance*\n\n` +
                `${wordCount}/50 words\n\n` +
                `*pour more of yourself into it...*`,
                false
            )
            .build();

        return interaction.reply({
            embeds: [embed],
            components: [createGate6TypeSelect()],
            ephemeral: true,
        });
    }

    // Store content
    const pending = pendingOfferings.get(member.id) || { type: 'words' };
    pending.content = content;
    pendingOfferings.set(member.id, pending);

    // Check if this is a "both" type needing image
    if (pending.type === 'both' && !pending.imageUrl) {
        await showUploadInstructions(interaction, true);
        return;
    }

    // Show preview
    await showPreview(interaction, member.id);
}

/**
 * Show upload instructions for image
 */
async function showUploadInstructions(interaction, hasWords = false) {
    const member = interaction.member;

    // Mark that we're awaiting an image from this user
    const pending = pendingOfferings.get(member.id);
    if (pending) {
        pending.awaitingImage = true;
        pending.channelId = interaction.channelId;
        pendingOfferings.set(member.id, pending);
    }

    const embed = new RitualEmbedBuilder(6, { mood: 'ornate' })
        .setRitualTitle('✿ your visual offering ✿')
        .setRitualDescription(
            (hasWords ? '*your words have been received...*\n\n' : '') +
            'now share your visual devotion.\n\n' +
            '**Send your image in this channel.**\n\n' +
            '*fan art, edits, photos... anything that shows your love*',
            false
        )
        .build();

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
            embeds: [embed],
            components: [],
        });
    } else {
        await interaction.reply({
            embeds: [embed],
            components: [],
            ephemeral: true,
        });
    }
}

/**
 * Show preview of offering
 */
async function showPreview(interaction, userId) {
    const pending = pendingOfferings.get(userId);

    if (!pending) {
        const embed = new RitualEmbedBuilder(6, { mood: 'normal' })
            .setRitualTitle('✿ no offering found ✿')
            .setRitualDescription('*start over and create your offering...*', false)
            .build();

        if (interaction.replied || interaction.deferred) {
            return interaction.editReply({
                embeds: [embed],
                components: [createGate6TypeSelect()],
            });
        } else {
            return interaction.reply({
                embeds: [embed],
                components: [createGate6TypeSelect()],
                ephemeral: true,
            });
        }
    }

    let description = '**Your Offering:**\n\n';

    if (pending.content) {
        const preview = pending.content.length > 500
            ? pending.content.substring(0, 500) + '...'
            : pending.content;
        description += `"${preview}"\n\n`;
        description += `*${pending.content.split(/\s+/).length} words*\n\n`;
    }

    if (pending.imageUrl) {
        description += `[Image attached]\n\n`;
    }

    description += '*review your offering before presenting it to Ika*';

    const embed = new RitualEmbedBuilder(6, { mood: 'soft' })
        .setRitualTitle('✿ preview ✿')
        .setRitualDescription(description, false)
        .build();

    if (pending.imageUrl) {
        embed.setImage(pending.imageUrl);
    }

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
            embeds: [embed],
            components: [createGate6PreviewButtons()],
        });
    } else {
        await interaction.reply({
            embeds: [embed],
            components: [createGate6PreviewButtons()],
            ephemeral: true,
        });
    }
}

/**
 * Handle "Present to Ika" button
 */
async function handlePresentButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate5)) {
        const embed = createNotReadyEmbed(5, 5);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 6)) {
        const embed = new RitualEmbedBuilder(6, { mood: 'ornate' })
            .setRitualTitle('✿ offering accepted ✿')
            .setRitualDescription('*your devotion has already been received*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Get pending offering
    const pending = pendingOfferings.get(member.id);
    if (!pending || (!pending.content && !pending.imageUrl)) {
        const embed = new RitualEmbedBuilder(6, { mood: 'normal' })
            .setRitualTitle('✿ no offering found ✿')
            .setRitualDescription('*create your offering first...*', false)
            .build();
        return interaction.update({
            embeds: [embed],
            components: [createGate6TypeSelect()],
        });
    }

    // Show processing
    const processingEmbed = new RitualEmbedBuilder(6, { mood: 'soft' })
        .setRitualTitle('✿ · · · ✿')
        .setRitualDescription('*Ika receives your offering...*', false)
        .build();

    await interaction.update({ embeds: [processingEmbed], components: [] });

    await responseDelay(2000);

    try {
        const imagePath = path.join(__dirname, '..', '..', '..', 'images', 'gate6_offering.png');
        const imageExists = fs.existsSync(imagePath);

        // Complete gate
        await assignGateRole(member, 6);
        const result = userOps.completeGate(member.id, 6, {
            gate_6_type: pending.type,
            gate_6_content: pending.content,
            gate_6_image: pending.imageUrl,
        });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 6`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 6 with ${pending.type} offering`);

        // Clean up
        pendingOfferings.delete(member.id);

        // Success embed
        const successEmbed = new RitualEmbedBuilder(6, { mood: 'soft' })
            .setRitualTitle('✿ Offering Accepted ✿')
            .setIkaMessage(maybeGlitch(messages.gate6?.success || "you made this... for me? i'll treasure it forever"))
            .addProgressVisualization(7)
            .setRitualFooter('your devotion is eternal');

        if (imageExists) {
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate6_offering.png' });
            successEmbed.setImage('attachment://gate6_offering.png');
            await interaction.editReply({ embeds: [successEmbed.build()], files: [attachment] });
        } else {
            await interaction.editReply({ embeds: [successEmbed.build()] });
        }

        // Post to offerings channel if configured
        await postToOfferingsChannel(interaction.client, member, pending);

    } catch (error) {
        console.error('Gate 6 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'glitching' })
            .setRitualTitle('✿ error ✿')
            .setIkaMessage('something went wrong... try again?')
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Handle "Revise" button
 */
async function handleReviseButton(interaction) {
    const member = interaction.member;

    // Clear pending and restart
    pendingOfferings.delete(member.id);

    const embed = new RitualEmbedBuilder(6, { mood: 'ornate' })
        .setRitualTitle('✿ start fresh ✿')
        .setRitualDescription(
            '*your previous draft fades...*\n\n' +
            '*what will you create instead?*',
            false
        )
        .build();

    await interaction.update({
        embeds: [embed],
        components: [createGate6TypeSelect()],
    });
}

/**
 * Handle upload button (info only)
 */
async function handleUploadButton(interaction) {
    await interaction.reply({
        content: '*Reply to this message with an image attachment*',
        ephemeral: true,
    });
}

/**
 * Post offering to public channel
 */
async function postToOfferingsChannel(client, member, offering) {
    const channelId = config.channels?.offerings;
    if (!channelId) return;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        let description = `**${member.user.tag}** has completed their offering\n\n`;

        if (offering.content) {
            const preview = offering.content.length > 300
                ? offering.content.substring(0, 300) + '...'
                : offering.content;
            description += `"${preview}"`;
        }

        const embed = new RitualEmbedBuilder(6, { mood: 'soft' })
            .setRitualTitle('✿ A New Offering ✿')
            .setRitualDescription(description, false)
            .setThumbnail(member.user.displayAvatarURL())
            .build();

        if (offering.imageUrl) {
            embed.setImage(offering.imageUrl);
        }

        await channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Failed to post offering:', error.message);
    }
}

/**
 * Handle image upload from messageCreate event
 * Returns true if the message was handled as a Gate 6 image upload
 */
async function handleImageUpload(message) {
    const userId = message.author.id;
    const pending = pendingOfferings.get(userId);

    // Check if this user is awaiting an image for Gate 6
    if (!pending || !pending.awaitingImage) {
        return false;
    }

    // Check if message has an image attachment
    const imageAttachment = message.attachments.find(att =>
        att.contentType?.startsWith('image/') ||
        att.url.match(/\.(png|jpg|jpeg|gif|webp)$/i)
    );

    if (!imageAttachment) {
        return false;
    }

    // Store the image URL
    pending.imageUrl = imageAttachment.url;
    pending.awaitingImage = false;
    pendingOfferings.set(userId, pending);

    console.log(`✧ Received Gate 6 image from ${message.author.tag}`);

    // Delete the user's image message to keep channel clean (optional)
    try {
        await message.delete();
    } catch (e) {
        // May not have permission to delete, that's okay
    }

    // Send preview
    const embed = new RitualEmbedBuilder(6, { mood: 'soft' })
        .setRitualTitle('✿ image received ✿')
        .setRitualDescription(
            '*your visual offering has been received*\n\n' +
            (pending.content ? `Words: ${pending.content.split(/\s+/).length} words\n\n` : '') +
            '*review your offering before presenting it*',
            false
        )
        .setImage(pending.imageUrl)
        .build();

    await message.channel.send({
        content: `<@${userId}>`,
        embeds: [embed],
        components: [createGate6PreviewButtons()],
    });

    return true;
}

/**
 * Check if a user is awaiting an image upload
 */
function isAwaitingImage(userId) {
    const pending = pendingOfferings.get(userId);
    return pending?.awaitingImage === true;
}

module.exports = {
    startOffering,
    handleButton,
    handleModal,
    handleSelect,
    handleImageUpload,
    isAwaitingImage,
    cleanupExpiredOfferings,
    pendingOfferings,
};
