/**
 * Gate 1 Flow: The Awakening
 *
 * Interactive flow for the first gate.
 * Users click button -> select phrase -> confirm -> complete gate.
 */

const config = require('../../config');
const { userOps } = require('../../database');
const { assignGateRole, hasRole } = require('../../utils/roles');
const { responseDelay } = require('../../utils/timing');
const { RitualEmbedBuilder } = require('../../ui');
const {
    createGate1BeginButton,
    createGate1PhraseSelect,
    createGate1ConfirmButton,
} = require('../builders/gateComponents');

// Store pending awakenings (userId -> selected phrase)
const pendingAwakenings = new Map();

// Wrong phrase responses
const WRONG_PHRASE_RESPONSES = {
    hello: "the void echoes back... but nothing answers",
    help: "no one can help you here... not yet",
    senpai: "*a distant giggle*... wrong name~",
    silence: "the silence is comfortable... but it won't open the gate",
};

/**
 * Start the Gate 1 awakening flow
 * Called when user should begin Gate 1
 */
async function startAwakening(interaction, options = {}) {
    const { ephemeral = true } = options;

    // Check if already completed
    if (userOps.hasCompletedGate(interaction.user.id, 1)) {
        const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
            .setRitualTitle('✧ already awakened ✧')
            .setRitualDescription('*you have already spoken her name*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new RitualEmbedBuilder(1, { mood: 'mysterious' })
        .setRitualTitle('✧ The Threshold ✧')
        .setRitualDescription(
            'you stand at the edge of something vast.\n\n' +
            'the air is thick with anticipation.\n' +
            'a name forms on your lips...\n\n' +
            '*what will you speak into the void?*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate1BeginButton()],
        ephemeral,
    });
}

/**
 * Handle button interactions for Gate 1
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate1_begin') {
        await handleBeginButton(interaction);
    } else if (customId === 'gate1_confirm') {
        await handleConfirmButton(interaction);
    }
}

/**
 * Handle select menu interactions for Gate 1
 */
async function handleSelect(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate1_phrase') {
        await handlePhraseSelect(interaction);
    }
}

/**
 * Handle "Begin the Awakening" button
 */
async function handleBeginButton(interaction) {
    // Check if already completed
    if (userOps.hasCompletedGate(interaction.user.id, 1)) {
        const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
            .setRitualTitle('✧ already awakened ✧')
            .setRitualDescription('*you have already spoken her name*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    const embed = new RitualEmbedBuilder(1, { mood: 'mysterious' })
        .setRitualTitle('✧ speak ✧')
        .setRitualDescription(
            'the void awaits your words.\n\n' +
            '*what name echoes in your heart?*',
            false
        )
        .build();

    await interaction.update({
        embeds: [embed],
        components: [createGate1PhraseSelect()],
    });
}

/**
 * Handle phrase selection
 */
async function handlePhraseSelect(interaction) {
    const selected = interaction.values[0];

    // Check if already completed
    if (userOps.hasCompletedGate(interaction.user.id, 1)) {
        const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
            .setRitualTitle('✧ already awakened ✧')
            .setRitualDescription('*you have already spoken her name*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    if (selected !== 'ika') {
        // Wrong phrase - atmospheric rejection
        const response = WRONG_PHRASE_RESPONSES[selected] || 'the words dissolve into nothing...';

        const embed = new RitualEmbedBuilder(1, { mood: 'mysterious' })
            .setRitualTitle('· · ·')
            .setRitualDescription(`*${response}*\n\ntry again...`, false)
            .build();

        await interaction.update({
            embeds: [embed],
            components: [createGate1PhraseSelect()],
        });
        return;
    }

    // Correct phrase - store and show confirmation
    pendingAwakenings.set(interaction.user.id, 'ika');

    const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
        .setRitualTitle('✧ ika ✧')
        .setRitualDescription(
            '*the name resonates in the void*\n\n' +
            'you feel something stirring...\n' +
            'someone is listening.\n\n' +
            '*are you ready to speak her name aloud?*',
            false
        )
        .build();

    await interaction.update({
        embeds: [embed],
        components: [createGate1ConfirmButton()],
    });
}

/**
 * Handle final confirmation
 */
async function handleConfirmButton(interaction) {
    const member = interaction.member;

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 1)) {
        const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
            .setRitualTitle('✧ already awakened ✧')
            .setRitualDescription('*you have already spoken her name*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Verify they went through the flow
    const pending = pendingAwakenings.get(member.id);
    if (pending !== 'ika') {
        const embed = new RitualEmbedBuilder(1, { mood: 'mysterious' })
            .setRitualTitle('· · ·')
            .setRitualDescription('*you must speak the name first...*', false)
            .build();
        return interaction.update({ embeds: [embed], components: [createGate1BeginButton()] });
    }

    // Show processing
    const processingEmbed = new RitualEmbedBuilder(1, { mood: 'soft' })
        .setRitualTitle('✧ · · · ✧')
        .setRitualDescription('*the void trembles*', false)
        .build();

    await interaction.update({ embeds: [processingEmbed], components: [] });

    // Atmospheric delay
    await responseDelay(1500);

    try {
        // Complete Gate 1
        await assignGateRole(member, 1);
        const result = userOps.completeGate(member.id, 1, {});

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 1 (interactive)`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 1 via interactive flow`);

        // Clean up
        pendingAwakenings.delete(member.id);

        // Success embed
        const successEmbed = new RitualEmbedBuilder(1, { mood: 'soft' })
            .setRitualTitle('✧ Awakened ✧')
            .setRitualDescription(
                '*she heard you*\n\n' +
                '「 ika 」\n\n' +
                'the name hangs in the air like a promise.\n' +
                'the first gate opens before you.\n\n' +
                '*welcome to the ritual.*',
                false
            )
            .addProgressVisualization(2)
            .setRitualFooter('Gate 1 Complete')
            .build();

        await interaction.editReply({ embeds: [successEmbed], components: [] });

    } catch (error) {
        console.error('Gate 1 completion error:', error);

        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'glitching' })
            .setRitualTitle('█▓░ error ░▓█')
            .setIkaMessage('something went wrong... try again?')
            .build();

        await interaction.editReply({ embeds: [errorEmbed], components: [] });
    }
}

/**
 * Create the initial welcome message for new users
 * Called from guildMemberAdd event
 */
function createWelcomeEmbed() {
    return new RitualEmbedBuilder(0, { mood: 'mysterious' })
        .setRitualTitle('✧ A New Soul Arrives ✧')
        .setRitualDescription(
            'you find yourself at the threshold.\n\n' +
            'something waits beyond the darkness.\n' +
            'it feels like it has been waiting for you.\n\n' +
            '*speak, and she may answer.*',
            false
        )
        .build();
}

module.exports = {
    startAwakening,
    handleButton,
    handleSelect,
    createWelcomeEmbed,
    pendingAwakenings,
};
