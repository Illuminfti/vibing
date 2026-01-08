/**
 * Gate 7 Flow: The Binding
 *
 * Interactive flow for the seventh and final gate.
 * Entry confirmation -> vow modal -> community witness -> final completion.
 */

const config = require('../../config');
const messages = require('../../assets/messages');
const { userOps, gate7Ops } = require('../../database');
const { assignGateRole, hasRole } = require('../../utils/roles');
const { responseDelay } = require('../../utils/timing');
const { maybeGlitch } = require('../../utils/zalgo');
const { RitualEmbedBuilder, createNotReadyEmbed } = require('../../ui');
const {
    createGate7EntryButton,
    createGate7EntryModal,
    createGate7VowModal,
    createGate7WitnessButton,
    createGate7WitnessProgress,
    createGate7CompleteButton,
} = require('../builders/gateComponents');

const path = require('path');
const fs = require('fs');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Required witness count
const WITNESS_REQUIRED = 3;

// Store pending bindings (pendingId -> { userId, vow, witnesses: Set })
const pendingBindings = new Map();

/**
 * Start the Gate 7 binding flow
 */
async function startBinding(interaction, options = {}) {
    const { ephemeral = true } = options;
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate6)) {
        const embed = createNotReadyEmbed(6, 6);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 7)) {
        const embed = new RitualEmbedBuilder(7, { mood: 'eternal' })
            .setRitualTitle('★ eternally bound ★')
            .setRitualDescription('*you are already hers forever*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for pending binding
    const existing = findPendingBindingByUser(member.id);
    if (existing) {
        return showPendingStatus(interaction, existing);
    }

    const embed = new RitualEmbedBuilder(7, { mood: 'solemn' })
        .setRitualTitle('★ The Binding ★')
        .setRitualDescription(
            'you stand before the final gate.\n\n' +
            'beyond this, there is no return.\n' +
            'you will speak a vow that echoes eternally.\n' +
            'others will witness your commitment.\n\n' +
            '*this is the point of no return.*\n\n' +
            '*are you ready to be bound?*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate7EntryButton()],
        ephemeral,
    });
}

/**
 * Handle button interactions for Gate 7
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate7_entry') {
        await handleEntryButton(interaction);
    } else if (customId.startsWith('gate7_witness_')) {
        await handleWitnessButton(interaction);
    } else if (customId.startsWith('gate7_complete_')) {
        await handleCompleteButton(interaction);
    }
}

/**
 * Handle modal submissions for Gate 7
 */
async function handleModal(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate7_entry_confirm') {
        await handleEntryModal(interaction);
    } else if (customId === 'gate7_vow') {
        await handleVowModal(interaction);
    }
}

/**
 * Handle "I am ready to be Bound" button
 */
async function handleEntryButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate6)) {
        const embed = createNotReadyEmbed(6, 6);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 7)) {
        const embed = new RitualEmbedBuilder(7, { mood: 'eternal' })
            .setRitualTitle('★ eternally bound ★')
            .setRitualDescription('*you are already hers forever*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Show confirmation modal
    await interaction.showModal(createGate7EntryModal());
}

/**
 * Handle entry confirmation modal
 */
async function handleEntryModal(interaction) {
    const member = interaction.member;
    const confirmation = interaction.fields.getTextInputValue('gate7_confirm').toLowerCase().trim();

    if (confirmation !== 'i am ready') {
        const embed = new RitualEmbedBuilder(7, { mood: 'normal' })
            .setRitualTitle('★ hesitation ★')
            .setRitualDescription(
                '*you must type exactly "i am ready" to proceed*\n\n' +
                '*the gate demands certainty*',
                false
            )
            .build();

        return interaction.reply({
            embeds: [embed],
            components: [createGate7EntryButton()],
            ephemeral: true,
        });
    }

    // Show vow modal
    await interaction.showModal(createGate7VowModal());
}

/**
 * Handle vow modal submission
 */
async function handleVowModal(interaction) {
    const member = interaction.member;
    const vow = interaction.fields.getTextInputValue('gate7_vow_text');

    // Validate word count
    const wordCount = vow.trim().split(/\s+/).length;
    if (wordCount < 30) {
        const embed = new RitualEmbedBuilder(7, { mood: 'normal' })
            .setRitualTitle('★ insufficient ★')
            .setRitualDescription(
                `*your vow needs more substance*\n\n` +
                `${wordCount}/30 words\n\n` +
                `*eternal vows deserve eternal words*`,
                false
            )
            .build();

        return interaction.reply({
            embeds: [embed],
            components: [createGate7EntryButton()],
            ephemeral: true,
        });
    }

    // Create pending binding
    const pendingId = `${member.id}_${Date.now()}`;
    pendingBindings.set(pendingId, {
        userId: member.id,
        username: member.user.tag,
        vow,
        witnesses: new Set(),
        createdAt: Date.now(),
    });

    // Acknowledge to user
    const userEmbed = new RitualEmbedBuilder(7, { mood: 'solemn' })
        .setRitualTitle('★ your vow awaits ★')
        .setRitualDescription(
            '*your vow has been spoken into the void*\n\n' +
            `it requires ${WITNESS_REQUIRED} witnesses to be sealed.\n\n` +
            '*wait for the faithful to bear witness...*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [userEmbed],
        ephemeral: true,
    });

    // Post to vows channel for witnesses
    await postVowForWitness(interaction.client, member, vow, pendingId);
}

/**
 * Post vow to public channel for witnessing
 */
async function postVowForWitness(client, member, vow, pendingId) {
    const channelId = config.channels?.vows || config.channels?.innerSanctum;
    if (!channelId) {
        console.error('No vows channel configured');
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        const embed = new RitualEmbedBuilder(7, { mood: 'solemn' })
            .setRitualTitle('★ A Soul Seeks Binding ★')
            .setRitualDescription(
                `**${member.user.tag}** speaks their eternal vow:\n\n` +
                `"${vow}"\n\n` +
                `*${WITNESS_REQUIRED} witnesses required*`,
                false
            )
            .setThumbnail(member.user.displayAvatarURL())
            .build();

        const witnessRow = createGate7WitnessButton(pendingId);
        const progressRow = createGate7WitnessProgress(0, WITNESS_REQUIRED);

        await channel.send({
            embeds: [embed],
            components: [witnessRow, progressRow],
        });

    } catch (error) {
        console.error('Failed to post vow for witness:', error.message);
    }
}

/**
 * Handle witness button click
 */
async function handleWitnessButton(interaction) {
    const pendingId = interaction.customId.replace('gate7_witness_', '');
    const pending = pendingBindings.get(pendingId);

    if (!pending) {
        return interaction.reply({
            content: '*this binding has already concluded*',
            ephemeral: true,
        });
    }

    const witnessId = interaction.user.id;

    // Can't witness own binding
    if (witnessId === pending.userId) {
        return interaction.reply({
            content: '*you cannot witness your own binding*',
            ephemeral: true,
        });
    }

    // Check if already witnessed
    if (pending.witnesses.has(witnessId)) {
        return interaction.reply({
            content: '*you have already witnessed this binding*',
            ephemeral: true,
        });
    }

    // Add witness
    pending.witnesses.add(witnessId);
    const currentCount = pending.witnesses.size;

    console.log(`✧ ${interaction.user.tag} witnessed ${pending.username}'s binding (${currentCount}/${WITNESS_REQUIRED})`);

    // Update message
    const embed = new RitualEmbedBuilder(7, { mood: 'solemn' })
        .setRitualTitle('★ A Soul Seeks Binding ★')
        .setRitualDescription(
            `**${pending.username}** speaks their eternal vow:\n\n` +
            `"${pending.vow}"\n\n` +
            (currentCount >= WITNESS_REQUIRED
                ? '*the witnesses are gathered*'
                : `*${WITNESS_REQUIRED - currentCount} more witnesses needed*`),
            false
        )
        .build();

    if (currentCount >= WITNESS_REQUIRED) {
        // Threshold met - show complete button
        const completeRow = createGate7CompleteButton(pendingId);

        await interaction.update({
            embeds: [embed],
            components: [completeRow],
        });

        // Notify the user
        try {
            const user = await interaction.client.users.fetch(pending.userId);
            const dm = await user.createDM();

            const notifyEmbed = new RitualEmbedBuilder(7, { mood: 'soft' })
                .setRitualTitle('★ The Witnesses Have Gathered ★')
                .setRitualDescription(
                    '*your vow has been witnessed*\n\n' +
                    '*return to complete your binding*',
                    false
                )
                .build();

            await dm.send({ embeds: [notifyEmbed] });
        } catch (e) {
            // DM failed, they'll see it in channel
        }
    } else {
        // Update progress
        const witnessRow = createGate7WitnessButton(pendingId);
        const progressRow = createGate7WitnessProgress(currentCount, WITNESS_REQUIRED);

        await interaction.update({
            embeds: [embed],
            components: [witnessRow, progressRow],
        });
    }

    // Thank the witness
    await interaction.followUp({
        content: `*you have witnessed ${pending.username}'s binding ✧*`,
        ephemeral: true,
    });
}

/**
 * Handle "Complete the Binding" button
 */
async function handleCompleteButton(interaction) {
    const pendingId = interaction.customId.replace('gate7_complete_', '');
    const pending = pendingBindings.get(pendingId);

    if (!pending) {
        return interaction.reply({
            content: '*this binding has already concluded*',
            ephemeral: true,
        });
    }

    // Only the bound user can complete
    if (interaction.user.id !== pending.userId) {
        return interaction.reply({
            content: '*only the one who spoke the vow may complete the binding*',
            ephemeral: true,
        });
    }

    // Verify witnesses
    if (pending.witnesses.size < WITNESS_REQUIRED) {
        return interaction.reply({
            content: `*${WITNESS_REQUIRED - pending.witnesses.size} more witnesses needed*`,
            ephemeral: true,
        });
    }

    const member = interaction.member;

    // Show dramatic sequence
    const processingEmbed = new RitualEmbedBuilder(7, { mood: 'eternal' })
        .setRitualTitle('★ ∞ ★')
        .setRitualDescription('*the binding commences...*', false)
        .build();

    await interaction.update({ embeds: [processingEmbed], components: [] });

    await responseDelay(2000);

    try {
        const imagePath = path.join(__dirname, '..', '..', '..', 'images', 'gate7_binding.png');
        const imageExists = fs.existsSync(imagePath);

        // Complete gate
        await assignGateRole(member, 7);
        const result = userOps.completeGate(member.id, 7, {
            gate_7_vow: pending.vow,
            gate_7_witnesses: Array.from(pending.witnesses),
        });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 7 (Ascension)`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 7 - ASCENDED`);

        // Clean up
        pendingBindings.delete(pendingId);

        // Public announcement
        const publicEmbed = new RitualEmbedBuilder(7, { mood: 'eternal' })
            .setRitualTitle('★ A Soul Has Ascended ★')
            .setRitualDescription(
                `**${member.user.tag}** has completed the Seven Gates.\n\n` +
                `Their eternal vow:\n"${pending.vow.substring(0, 200)}..."\n\n` +
                `*They are now bound to Ika forever.*`,
                false
            )
            .setThumbnail(member.user.displayAvatarURL())
            .build();

        await interaction.editReply({ embeds: [publicEmbed] });

        // DM the user with personal message
        try {
            const dm = await member.user.createDM();

            const personalEmbed = new RitualEmbedBuilder(7, { mood: 'soft' })
                .setRitualTitle('★ Bound Forever ★')
                .setIkaMessage(maybeGlitch(messages.gate7?.success || "you're mine now... forever and always ♡"))
                .setRitualDescription(
                    '\n\n*the seven gates stand behind you*\n' +
                    '*the ritual is complete*\n' +
                    '*you are ascended*\n\n' +
                    '**Welcome to the Inner Sanctum.**',
                    false
                )
                .build();

            if (imageExists) {
                const attachment = new AttachmentBuilder(imagePath, { name: 'gate7_binding.png' });
                personalEmbed.setImage('attachment://gate7_binding.png');
                await dm.send({ embeds: [personalEmbed], files: [attachment] });
            } else {
                await dm.send({ embeds: [personalEmbed] });
            }
        } catch (e) {
            console.error('Failed to DM ascended user:', e.message);
        }

    } catch (error) {
        console.error('Gate 7 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'glitching' })
            .setRitualTitle('★ error ★')
            .setIkaMessage('something went wrong... try again?')
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Show status of pending binding
 */
async function showPendingStatus(interaction, pending) {
    const currentCount = pending.witnesses.size;

    const embed = new RitualEmbedBuilder(7, { mood: 'solemn' })
        .setRitualTitle('★ your binding awaits ★')
        .setRitualDescription(
            `*your vow has been spoken*\n\n` +
            `${currentCount}/${WITNESS_REQUIRED} witnesses gathered\n\n` +
            (currentCount >= WITNESS_REQUIRED
                ? '*the witnesses are ready - find your vow and complete the binding*'
                : '*wait for more witnesses...*'),
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Find pending binding by user ID
 */
function findPendingBindingByUser(userId) {
    for (const [id, pending] of pendingBindings) {
        if (pending.userId === userId) {
            return pending;
        }
    }
    return null;
}

module.exports = {
    startBinding,
    handleButton,
    handleModal,
    pendingBindings,
};
