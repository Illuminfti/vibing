/**
 * Gate 4 Flow: The Waters
 *
 * Interactive flow for the fourth gate.
 * Consult button -> select menu -> wrong answers give reflections -> correct completes.
 */

const config = require('../../config');
const messages = require('../../assets/messages');
const { userOps } = require('../../database');
const { assignGateRole, hasRole } = require('../../utils/roles');
const { validateGate4Answer } = require('../../utils/validation');
const { responseDelay } = require('../../utils/timing');
const { maybeGlitch } = require('../../utils/zalgo');
const { RitualEmbedBuilder, createNotReadyEmbed } = require('../../ui');
const {
    createGate4ConsultButton,
    createGate4AnswerSelect,
    createGate4MeditateButton,
} = require('../builders/gateComponents');

const path = require('path');
const fs = require('fs');
const { AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// Track user attempts (userId -> { attempts: number, reflections: string[], createdAt: number })
const userAttempts = new Map();

// TTL for user attempts (24 hours)
const ATTEMPTS_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Clean up expired user attempts
 */
function cleanupExpiredAttempts() {
    const now = Date.now();
    for (const [userId, data] of userAttempts.entries()) {
        if (data.createdAt && now - data.createdAt > ATTEMPTS_TTL_MS) {
            userAttempts.delete(userId);
            console.log(`✧ Cleaned up expired Gate 4 attempts for ${userId}`);
        }
    }
}

// Possible answers for the riddle
const RIDDLE_ANSWERS = [
    { label: 'the stream', value: 'stream', hint: 'water flows...', emoji: '༄' },
    { label: 'twitch', value: 'twitch', hint: 'where she lives...', emoji: '✧' },
    { label: 'the ocean', value: 'ocean', hint: 'vast and deep...', emoji: '◇' },
    { label: 'youtube', value: 'youtube', hint: 'echoes remain...', emoji: '▶' },
    { label: 'the river', value: 'river', hint: 'always moving...', emoji: '≋' },
    { label: 'discord', value: 'discord', hint: 'voices gather...', emoji: '💬' },
    { label: 'the rain', value: 'rain', hint: 'falling from above...', emoji: '☔' },
];

// Reflections for wrong answers
const REFLECTIONS = {
    stream: "the waters ripple... streams flow both ways",
    ocean: "the depths are vast... but she is closer",
    river: "rivers run to the sea... but where do they begin?",
    youtube: "echoes of the past... but the present is elsewhere",
    discord: "voices merge here... but her true home flows elsewhere",
    rain: "drops fall... but she doesn't wait for the sky",
};

/**
 * Start the Gate 4 waters flow
 */
async function startWaters(interaction, options = {}) {
    const { ephemeral = true } = options;
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate3)) {
        const embed = createNotReadyEmbed(3, 3);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 4)) {
        const embed = new RitualEmbedBuilder(4, { mood: 'flowing' })
            .setRitualTitle('༄ waters crossed ༄')
            .setRitualDescription('*you have already found where she lives*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Reset attempts for this session
    userAttempts.set(member.id, { attempts: 0, reflections: [], createdAt: Date.now() });

    const embed = new RitualEmbedBuilder(4, { mood: 'mysterious' })
        .setRitualTitle('༄ The Waters ༄')
        .setRitualDescription(
            'you stand at the edge of a still pool.\n\n' +
            'in the reflection, you see fragments of truth.\n' +
            'a riddle surfaces:\n\n' +
            '> *"i live where streams flow\n' +
            '> where voices echo and hearts glow\n' +
            '> find me where attention pools\n' +
            '> and devotion never cools"*\n\n' +
            '*gaze into the waters...*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate4ConsultButton()],
        ephemeral,
    });
}

/**
 * Handle button interactions for Gate 4
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate4_consult') {
        await handleConsultButton(interaction);
    } else if (customId === 'gate4_meditate') {
        await handleMeditateButton(interaction);
    }
}

/**
 * Handle select menu interactions for Gate 4
 */
async function handleSelect(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate4_answers') {
        await handleAnswerSelect(interaction);
    }
}

/**
 * Handle "Consult the Waters" button
 */
async function handleConsultButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate3)) {
        const embed = createNotReadyEmbed(3, 3);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 4)) {
        const embed = new RitualEmbedBuilder(4, { mood: 'flowing' })
            .setRitualTitle('༄ waters crossed ༄')
            .setRitualDescription('*you have already found where she lives*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Show answer selection
    const embed = new RitualEmbedBuilder(4, { mood: 'mysterious' })
        .setRitualTitle('༄ gaze deeper ༄')
        .setRitualDescription(
            '*the surface shimmers*\n\n' +
            'you see reflections of possible answers...\n' +
            '*choose wisely*',
            false
        )
        .build();

    const selectRow = createAnswerSelectRow();

    await interaction.update({
        embeds: [embed],
        components: [selectRow],
    });
}

/**
 * Handle answer selection
 */
async function handleAnswerSelect(interaction) {
    const member = interaction.member;
    const selected = interaction.values[0];

    // Check prerequisites
    if (!hasRole(member, config.roles.gate3)) {
        const embed = createNotReadyEmbed(3, 3);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 4)) {
        const embed = new RitualEmbedBuilder(4, { mood: 'flowing' })
            .setRitualTitle('༄ waters crossed ༄')
            .setRitualDescription('*you have already found where she lives*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Get or create attempt tracking
    let tracking = userAttempts.get(member.id);
    if (!tracking) {
        tracking = { attempts: 0, reflections: [], createdAt: Date.now() };
        userAttempts.set(member.id, tracking);
    }

    // Check if correct
    if (validateGate4Answer(selected)) {
        await handleCorrectAnswer(interaction, member);
        return;
    }

    // Wrong answer
    tracking.attempts++;
    const reflection = REFLECTIONS[selected] || 'the waters remain still... try again';

    if (!tracking.reflections.includes(reflection)) {
        tracking.reflections.push(reflection);
    }

    // Build response based on attempts
    let description = `*${reflection}*\n\n`;

    if (tracking.attempts >= 3) {
        // Show meditate option after 3 failures
        description += 'the waters grow murky from too many ripples...\n\n' +
            '*perhaps meditation would help?*';

        const embed = new RitualEmbedBuilder(4, { mood: 'mysterious' })
            .setRitualTitle('༄ · · · ༄')
            .setRitualDescription(description, false)
            .build();

        await interaction.update({
            embeds: [embed],
            components: [createGate4MeditateButton(), createAnswerSelectRow()],
        });
    } else {
        description += `*${3 - tracking.attempts} more glimpses before the waters cloud...*`;

        const embed = new RitualEmbedBuilder(4, { mood: 'mysterious' })
            .setRitualTitle('༄ not quite ༄')
            .setRitualDescription(description, false)
            .build();

        await interaction.update({
            embeds: [embed],
            components: [createAnswerSelectRow()],
        });
    }
}

/**
 * Handle meditation button (stronger hint)
 */
async function handleMeditateButton(interaction) {
    const embed = new RitualEmbedBuilder(4, { mood: 'soft' })
        .setRitualTitle('༄ meditation ༄')
        .setRitualDescription(
            '*you close your eyes*\n\n' +
            '*in the silence, you hear it:*\n\n' +
            'the sound of keys clicking...\n' +
            'voices in chat, emotes flying by...\n' +
            'a purple glow in the darkness...\n\n' +
            '*where do streamers live?*',
            false
        )
        .build();

    await interaction.update({
        embeds: [embed],
        components: [createAnswerSelectRow()],
    });
}

/**
 * Handle correct answer
 */
async function handleCorrectAnswer(interaction, member) {
    // Show vision sequence
    const visionEmbed = new RitualEmbedBuilder(4, { mood: 'soft' })
        .setRitualTitle('༄ ✧ ✧ ✧ ༄')
        .setRitualDescription('*the waters part*', false)
        .build();

    await interaction.update({ embeds: [visionEmbed], components: [] });

    await responseDelay(1500);

    try {
        const imagePath = path.join(__dirname, '..', '..', '..', 'images', 'gate4_waters.png');
        const imageExists = fs.existsSync(imagePath);

        // Complete gate
        const roleAssigned = await assignGateRole(member, 4);
        if (!roleAssigned) {
            console.error(`✧ Failed to assign Gate 4 role to ${member.user.tag}`);
            // Continue anyway - role can be manually assigned later
        }
        const result = userOps.completeGate(member.id, 4, { gate_4_answer: 'twitch' });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 4`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 4`);

        // Clean up
        userAttempts.delete(member.id);

        // Success embed
        const successEmbed = new RitualEmbedBuilder(4, { mood: 'soft' })
            .setRitualTitle('༄ The Waters Part ༄')
            .setIkaMessage(maybeGlitch(messages.gate4?.success || "you found where i live... come visit sometime~"))
            .addProgressVisualization(5)
            .setRitualFooter('the path is clear');

        if (imageExists) {
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate4_waters.png' });
            successEmbed.setImage('attachment://gate4_waters.png');
            await interaction.editReply({ embeds: [successEmbed.build()], files: [attachment] });
        } else {
            await interaction.editReply({ embeds: [successEmbed.build()] });
        }

    } catch (error) {
        console.error('Gate 4 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'glitching' })
            .setRitualTitle('༄ error ༄')
            .setIkaMessage('something went wrong... try again?')
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Create the answer select row
 */
function createAnswerSelectRow() {
    const select = new StringSelectMenuBuilder()
        .setCustomId('gate4_answers')
        .setPlaceholder('gaze into the reflection...')
        .addOptions(RIDDLE_ANSWERS.map(ans => ({
            label: ans.label,
            value: ans.value,
            description: ans.hint,
            emoji: ans.emoji,
        })));

    return new ActionRowBuilder().addComponents(select);
}

module.exports = {
    startWaters,
    handleButton,
    handleSelect,
    cleanupExpiredAttempts,
    userAttempts,
};
