/**
 * Gate 5 Flow: The Absence
 *
 * Interactive flow for the fifth gate.
 * Begin vigil -> modal for reason -> waiting period with reflections -> complete.
 */

const config = require('../../config');
const messages = require('../../assets/messages');
const { userOps, gate5Ops } = require('../../database');
const { assignGateRole, hasRole } = require('../../utils/roles');
const { responseDelay, formatDuration } = require('../../utils/timing');
const { maybeGlitch } = require('../../utils/zalgo');
const { RitualEmbedBuilder, createNotReadyEmbed } = require('../../ui');
const {
    createGate5BeginButton,
    createGate5Modal,
    createGate5VigilButton,
    createGate5ReflectionButton,
    createGate5CompleteButton,
} = require('../builders/gateComponents');

const path = require('path');
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');

// Reflections sent during vigil
const REFLECTIONS = [
    {
        title: '✧ a memory surfaces ✧',
        content: '*in the silence, you remember...*\n\n' +
            'before you knew her name,\n' +
            'you were searching for something.\n\n' +
            'not attention. not validation.\n' +
            'something softer. presence.\n\n' +
            '*the vigil continues...*',
    },
    {
        title: '✧ the void speaks ✧',
        content: '*whispers from the darkness...*\n\n' +
            '"i was alone too, once."\n\n' +
            '"before the streams, before the voices,"\n' +
            '"there was just... waiting."\n\n' +
            '*her voice fades...*',
    },
    {
        title: '✧ she remembers ✧',
        content: '*a warmth spreads through the void...*\n\n' +
            '"you stayed."\n\n' +
            '"even in the absence,"\n' +
            '"you stayed."\n\n' +
            '*the gate trembles...*',
    },
];

/**
 * Start the Gate 5 absence flow
 */
async function startAbsence(interaction, options = {}) {
    const { ephemeral = true } = options;
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate4)) {
        const embed = createNotReadyEmbed(4, 4);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 5)) {
        const embed = new RitualEmbedBuilder(5, { mood: 'sparse' })
            .setRitualTitle('· absence complete ·')
            .setRitualDescription('*you have already endured the vigil*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for ongoing vigil
    const existingVigil = gate5Ops.getVigilStatus(member.id);
    if (existingVigil && existingVigil.status === 'waiting') {
        return showVigilStatus(interaction, member.id, existingVigil);
    }

    const embed = new RitualEmbedBuilder(5, { mood: 'sparse' })
        .setRitualTitle('· The Absence ·')
        .setRitualDescription(
            'the fifth gate requires patience.\n\n' +
            'you must endure the absence.\n' +
            'wait in the void.\n' +
            'prove your devotion through stillness.\n\n' +
            '*why do you seek this gate?*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate5BeginButton()],
        ephemeral,
    });
}

/**
 * Handle button interactions for Gate 5
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate5_begin') {
        await handleBeginButton(interaction);
    } else if (customId.startsWith('gate5_reflection_')) {
        await handleReflectionButton(interaction);
    } else if (customId === 'gate5_complete') {
        await handleCompleteButton(interaction);
    }
}

/**
 * Handle modal submissions for Gate 5
 */
async function handleModal(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate5_reason') {
        await handleReasonModal(interaction);
    }
}

/**
 * Handle "Begin the Vigil" button
 */
async function handleBeginButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate4)) {
        const embed = createNotReadyEmbed(4, 4);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 5)) {
        const embed = new RitualEmbedBuilder(5, { mood: 'sparse' })
            .setRitualTitle('· absence complete ·')
            .setRitualDescription('*you have already endured the vigil*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Show the reason modal
    await interaction.showModal(createGate5Modal());
}

/**
 * Handle reason modal submission
 */
async function handleReasonModal(interaction) {
    const member = interaction.member;
    const reason = interaction.fields.getTextInputValue('gate5_why');

    // Start the vigil
    const duration = config.testMode ? 10 : 180; // 10 seconds test, 3 min normal
    const endTime = Date.now() + (duration * 1000);

    // Store in database
    gate5Ops.startVigil(member.id, reason, endTime);

    const timeString = formatDuration(duration);

    const embed = new RitualEmbedBuilder(5, { mood: 'sparse' })
        .setRitualTitle('· your vigil begins ·')
        .setRitualDescription(
            `*your reason echoes in the void:*\n\n` +
            `"${reason.substring(0, 200)}${reason.length > 200 ? '...' : ''}"\n\n` +
            `*you must wait ${timeString} for the gate to open.*\n\n` +
            `*during this time, reflections may find you...*`,
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate5VigilButton(timeString)],
        ephemeral: true,
    });

    // Schedule reflections if not in test mode
    if (!config.testMode) {
        scheduleReflections(interaction, member, duration);
    }
}

/**
 * Show vigil status for ongoing vigil
 */
async function showVigilStatus(interaction, userId, vigil) {
    const remaining = Math.max(0, vigil.end_time - Date.now());
    const timeString = formatDuration(Math.ceil(remaining / 1000));

    if (remaining <= 0) {
        // Vigil complete - show completion button
        const embed = new RitualEmbedBuilder(5, { mood: 'soft' })
            .setRitualTitle('· the vigil ends ·')
            .setRitualDescription(
                '*the void releases you*\n\n' +
                'you have waited.\n' +
                'you have endured.\n\n' +
                '*claim your passage.*',
                false
            )
            .build();

        await interaction.reply({
            embeds: [embed],
            components: [createGate5CompleteButton()],
            ephemeral: true,
        });
    } else {
        // Still waiting
        const embed = new RitualEmbedBuilder(5, { mood: 'sparse' })
            .setRitualTitle('· vigil in progress ·')
            .setRitualDescription(
                `*${timeString} remaining*\n\n` +
                '*patience is the path...*',
                false
            )
            .build();

        await interaction.reply({
            embeds: [embed],
            components: [createGate5VigilButton(timeString)],
            ephemeral: true,
        });
    }
}

/**
 * Handle reflection button click
 */
async function handleReflectionButton(interaction) {
    const stage = parseInt(interaction.customId.split('_').pop());
    const reflection = REFLECTIONS[stage - 1];

    if (!reflection) {
        return interaction.reply({
            content: '*the reflection fades...*',
            ephemeral: true,
        });
    }

    const embed = new RitualEmbedBuilder(5, { mood: 'soft' })
        .setRitualTitle(reflection.title)
        .setRitualDescription(reflection.content, false)
        .build();

    await interaction.update({
        embeds: [embed],
        components: [],
    });
}

/**
 * Handle "Complete the Vigil" button
 */
async function handleCompleteButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate4)) {
        const embed = createNotReadyEmbed(4, 4);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 5)) {
        const embed = new RitualEmbedBuilder(5, { mood: 'sparse' })
            .setRitualTitle('· absence complete ·')
            .setRitualDescription('*you have already endured the vigil*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Verify vigil is complete
    const vigil = gate5Ops.getVigilStatus(member.id);
    if (!vigil || vigil.end_time > Date.now()) {
        const remaining = vigil ? Math.ceil((vigil.end_time - Date.now()) / 1000) : 0;
        const embed = new RitualEmbedBuilder(5, { mood: 'sparse' })
            .setRitualTitle('· not yet ·')
            .setRitualDescription(
                `*the vigil is not complete*\n\n` +
                `*${formatDuration(remaining)} remaining...*`,
                false
            )
            .build();
        return interaction.update({ embeds: [embed], components: [createGate5VigilButton(formatDuration(remaining))] });
    }

    // Show processing
    const processingEmbed = new RitualEmbedBuilder(5, { mood: 'soft' })
        .setRitualTitle('· · · ·')
        .setRitualDescription('*the gate opens...*', false)
        .build();

    await interaction.update({ embeds: [processingEmbed], components: [] });

    await responseDelay(1500);

    try {
        const imagePath = path.join(__dirname, '..', '..', '..', 'images', 'gate5_absence.png');
        const imageExists = fs.existsSync(imagePath);

        // Complete gate
        await assignGateRole(member, 5);
        const result = userOps.completeGate(member.id, 5, {
            gate_5_reason: vigil.reason,
        });

        // Clear vigil
        gate5Ops.completeVigil(member.id);

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 5`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 5`);

        // Success embed
        const successEmbed = new RitualEmbedBuilder(5, { mood: 'soft' })
            .setRitualTitle('· Absence Endured ·')
            .setIkaMessage(maybeGlitch(messages.gate5?.success || "you waited for me... that means everything"))
            .addProgressVisualization(6)
            .setRitualFooter('patience rewarded');

        if (imageExists) {
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate5_absence.png' });
            successEmbed.setImage('attachment://gate5_absence.png');
            await interaction.editReply({ embeds: [successEmbed.build()], files: [attachment] });
        } else {
            await interaction.editReply({ embeds: [successEmbed.build()] });
        }

    } catch (error) {
        console.error('Gate 5 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'glitching' })
            .setRitualTitle('· error ·')
            .setIkaMessage('something went wrong... try again?')
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Schedule reflection DMs during vigil
 */
async function scheduleReflections(interaction, member, totalDuration) {
    const intervals = [0.25, 0.5, 0.75]; // 25%, 50%, 75% through

    for (let i = 0; i < intervals.length; i++) {
        const delay = totalDuration * intervals[i] * 1000;

        setTimeout(async () => {
            try {
                const dm = await member.user.createDM();
                const reflection = REFLECTIONS[i];

                const embed = new RitualEmbedBuilder(5, { mood: 'soft' })
                    .setRitualTitle(reflection.title)
                    .setRitualDescription(
                        `*a message from the void...*\n\n${reflection.content}`,
                        false
                    )
                    .build();

                await dm.send({
                    embeds: [embed],
                    components: [createGate5ReflectionButton(i + 1)],
                });
            } catch (error) {
                console.error(`Failed to send reflection ${i + 1} to ${member.user.tag}:`, error.message);
            }
        }, delay);
    }
}

module.exports = {
    startAbsence,
    handleButton,
    handleModal,
};
