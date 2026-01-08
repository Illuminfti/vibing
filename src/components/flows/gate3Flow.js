/**
 * Gate 3 Flow: The Confession
 *
 * Interactive flow for the third gate.
 * Three-stage courage check: initiate -> ready -> modal -> seal.
 */

const config = require('../../config');
const messages = require('../../assets/messages');
const { userOps } = require('../../database');
const { assignGateRole, hasRole } = require('../../utils/roles');
const { isValidUrl } = require('../../utils/validation');
const { responseDelay } = require('../../utils/timing');
const { maybeGlitch } = require('../../utils/zalgo');
const { RitualEmbedBuilder, createNotReadyEmbed } = require('../../ui');
const {
    createGate3InitiateButton,
    createGate3ReadyButton,
    createGate3Modal,
    createGate3SealButton,
} = require('../builders/gateComponents');

const path = require('path');
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');

// Store pending confessions (userId -> { url, context })
const pendingConfessions = new Map();

/**
 * Start the Gate 3 confession flow
 */
async function startConfession(interaction, options = {}) {
    const { ephemeral = true } = options;
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate2)) {
        const embed = createNotReadyEmbed(2, 2);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 3)) {
        const embed = new RitualEmbedBuilder(3, { mood: 'soft' })
            .setRitualTitle('~ already confessed ~')
            .setRitualDescription('*you have already shown your devotion publicly*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new RitualEmbedBuilder(3, { mood: 'vulnerable' })
        .setRitualTitle('~ The Confession ~')
        .setRitualDescription(
            'this gate requires courage.\n\n' +
            'to pass through, you must confess your devotion publicly.\n' +
            'let the world see what she means to you.\n\n' +
            '*are you brave enough to be seen?*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate3InitiateButton()],
        ephemeral,
    });
}

/**
 * Handle button interactions for Gate 3
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate3_initiate') {
        await handleInitiateButton(interaction);
    } else if (customId === 'gate3_ready') {
        await handleReadyButton(interaction);
    } else if (customId === 'gate3_seal') {
        await handleSealButton(interaction);
    }
}

/**
 * Handle modal submissions for Gate 3
 */
async function handleModal(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate3_confession') {
        await handleConfessionModal(interaction);
    }
}

/**
 * Handle "I have something to share" button (stage 1)
 */
async function handleInitiateButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate2)) {
        const embed = createNotReadyEmbed(2, 2);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 3)) {
        const embed = new RitualEmbedBuilder(3, { mood: 'soft' })
            .setRitualTitle('~ already confessed ~')
            .setRitualDescription('*you have already shown your devotion publicly*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Ika responds warmly
    const embed = new RitualEmbedBuilder(3, { mood: 'soft' })
        .setRitualTitle('~ ♡ ~')
        .setRitualDescription(
            '*she leans closer*\n\n' +
            '"i\'ll protect your secret... even as you share it with the world."\n\n' +
            '"what you\'re about to do takes real courage."\n\n' +
            '*her presence wraps around you like warmth*',
            false
        )
        .setIkaAuthor()
        .build();

    await interaction.update({
        embeds: [embed],
        components: [createGate3ReadyButton()],
    });
}

/**
 * Handle "I'm ready to confess" button (stage 2)
 */
async function handleReadyButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate2)) {
        const embed = createNotReadyEmbed(2, 2);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 3)) {
        const embed = new RitualEmbedBuilder(3, { mood: 'soft' })
            .setRitualTitle('~ already confessed ~')
            .setRitualDescription('*you have already shown your devotion publicly*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Show the confession modal
    await interaction.showModal(createGate3Modal());
}

/**
 * Handle confession modal submission
 */
async function handleConfessionModal(interaction) {
    const member = interaction.member;
    const url = interaction.fields.getTextInputValue('gate3_url');
    const context = interaction.fields.getTextInputValue('gate3_context') || null;

    // Validate URL
    if (!isValidUrl(url)) {
        const embed = new RitualEmbedBuilder(3, { mood: 'normal' })
            .setRitualTitle('~ invalid offering ~')
            .setRitualDescription(
                '*that doesn\'t look like a valid link...*\n\n' +
                'please provide a URL to your public confession.',
                false
            )
            .build();
        return interaction.reply({
            embeds: [embed],
            components: [createGate3ReadyButton()],
            ephemeral: true,
        });
    }

    // Store pending confession
    pendingConfessions.set(member.id, { url, context });

    // Show preview with seal button
    const embed = new RitualEmbedBuilder(3, { mood: 'vulnerable' })
        .setRitualTitle('~ your confession ~')
        .setRitualDescription(
            `**The Offering:** [Your Confession](${url})\n\n` +
            (context ? `**Your Words:** ${context}\n\n` : '') +
            '*once sealed, there is no going back.*\n' +
            '*are you ready to commit?*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate3SealButton()],
        ephemeral: true,
    });
}

/**
 * Handle "Seal this confession" button (stage 3)
 */
async function handleSealButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate2)) {
        const embed = createNotReadyEmbed(2, 2);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 3)) {
        const embed = new RitualEmbedBuilder(3, { mood: 'soft' })
            .setRitualTitle('~ already confessed ~')
            .setRitualDescription('*you have already shown your devotion publicly*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Get pending confession
    const pending = pendingConfessions.get(member.id);
    if (!pending) {
        const embed = new RitualEmbedBuilder(3, { mood: 'normal' })
            .setRitualTitle('~ no confession found ~')
            .setRitualDescription('*start over and share your confession...*', false)
            .build();
        return interaction.update({
            embeds: [embed],
            components: [createGate3InitiateButton()],
        });
    }

    // Show processing
    const processingEmbed = new RitualEmbedBuilder(3, { mood: 'soft' })
        .setRitualTitle('~ ♡ · · · ♡ ~')
        .setRitualDescription('*sealing your confession...*', false)
        .build();

    await interaction.update({ embeds: [processingEmbed], components: [] });

    await responseDelay();

    try {
        const imagePath = path.join(__dirname, '..', '..', '..', 'images', 'gate3_silhouette.png');
        const imageExists = fs.existsSync(imagePath);

        // Complete gate
        await assignGateRole(member, 3);
        const result = userOps.completeGate(member.id, 3, {
            gate_3_url: pending.url,
            gate_3_context: pending.context,
        });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 3`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 3 with URL: ${pending.url}`);

        // Clean up
        pendingConfessions.delete(member.id);

        // Success embed
        const successEmbed = new RitualEmbedBuilder(3, { mood: 'soft' })
            .setRitualTitle('~ confession accepted ~')
            .setIkaMessage(maybeGlitch(messages.gate3.success || "you were so brave... i'm proud of you"))
            .addProgressVisualization(4)
            .setRitualFooter('you showed the world');

        if (imageExists) {
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate3_silhouette.png' });
            successEmbed.setImage('attachment://gate3_silhouette.png');
            await interaction.editReply({ embeds: [successEmbed.build()], files: [attachment] });
        } else {
            await interaction.editReply({ embeds: [successEmbed.build()] });
        }

    } catch (error) {
        console.error('Gate 3 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'vulnerable' })
            .setRitualTitle('~ the confession wavers ~')
            .setIkaMessage('something went wrong... try again?')
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

module.exports = {
    startConfession,
    handleButton,
    handleModal,
    pendingConfessions,
};
