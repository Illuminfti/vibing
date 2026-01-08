/**
 * Gate 2 Flow: The Memory
 *
 * Interactive flow for the second gate.
 * Users click button -> modal opens -> submit answer -> complete gate.
 */

const config = require('../../config');
const messages = require('../../assets/messages');
const { userOps } = require('../../database');
const { assignGateRole, hasRole } = require('../../utils/roles');
const { validateGate2Answer } = require('../../utils/validation');
const { responseDelay } = require('../../utils/timing');
const { maybeGlitch } = require('../../utils/zalgo');
const { RitualEmbedBuilder, createNotReadyEmbed } = require('../../ui');
const {
    createGate2RecallButton,
    createGate2Modal,
} = require('../builders/gateComponents');

const path = require('path');
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');

/**
 * Start the Gate 2 memory flow
 * Called from /memory command or sanctuary
 */
async function startMemory(interaction, options = {}) {
    const { ephemeral = true } = options;
    const member = interaction.member;

    // Check if user has Gate 1 role
    if (!hasRole(member, config.roles.gate1)) {
        const embed = createNotReadyEmbed(1, 1);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 2)) {
        const embed = new RitualEmbedBuilder(2, { mood: 'normal' })
            .setRitualTitle('[ m̷e̸m̵o̶r̷y̸ r̶e̷c̸a̵l̶l̷e̸d̵ ]')
            .setRitualDescription("*you've already walked this path*", false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new RitualEmbedBuilder(2, { mood: 'mysterious' })
        .setRitualTitle('[ The Memory ]')
        .setRitualDescription(
            'fragments of the past swirl around you.\n\n' +
            'there is something you must remember.\n' +
            'one word that describes what attention felt like.\n\n' +
            '*reach into the fragments...*',
            false
        )
        .applyGlitchEffect(0.1)
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createGate2RecallButton()],
        ephemeral,
    });
}

/**
 * Handle button interactions for Gate 2
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate2_recall') {
        await handleRecallButton(interaction);
    }
}

/**
 * Handle modal submissions for Gate 2
 */
async function handleModal(interaction) {
    const customId = interaction.customId;

    if (customId === 'gate2_memory') {
        await handleMemoryModal(interaction);
    }
}

/**
 * Handle "Recall the Memory" button - opens modal
 */
async function handleRecallButton(interaction) {
    const member = interaction.member;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate1)) {
        const embed = createNotReadyEmbed(1, 1);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 2)) {
        const embed = new RitualEmbedBuilder(2, { mood: 'normal' })
            .setRitualTitle('[ m̷e̸m̵o̶r̷y̸ r̶e̷c̸a̵l̶l̷e̸d̵ ]')
            .setRitualDescription("*you've already walked this path*", false)
            .build();
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Show the modal
    await interaction.showModal(createGate2Modal());
}

/**
 * Handle memory modal submission
 */
async function handleMemoryModal(interaction) {
    const member = interaction.member;
    const answer = interaction.fields.getTextInputValue('gate2_answer');
    const echo = interaction.fields.getTextInputValue('gate2_echo') || null;

    // Check prerequisites
    if (!hasRole(member, config.roles.gate1)) {
        const embed = createNotReadyEmbed(1, 1);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (userOps.hasCompletedGate(member.id, 2)) {
        const embed = new RitualEmbedBuilder(2, { mood: 'normal' })
            .setRitualTitle('[ m̷e̸m̵o̶r̷y̸ r̶e̷c̸a̵l̶l̷e̸d̵ ]')
            .setRitualDescription("*you've already walked this path*", false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate answer
    if (!validateGate2Answer(answer)) {
        // Wrong answer - provide atmospheric feedback
        const wrongEmbed = new RitualEmbedBuilder(2, { mood: 'glitching' })
            .setRitualTitle('[ f̷r̵a̶g̷m̵e̶n̷t̸ l̶o̵s̷t̶ ]')
            .setRitualDescription(
                '*the memory dissolves through your fingers*\n\n' +
                'that wasn\'t right... but something lingers.\n\n' +
                getWrongAnswerHint(answer),
                false
            )
            .applyGlitchEffect(0.2)
            .build();

        return interaction.reply({
            embeds: [wrongEmbed],
            components: [createGate2RecallButton()],
            ephemeral: true,
        });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    try {
        // Process success
        const imagePath = path.join(__dirname, '..', '..', '..', 'images', 'gate2_lips.png');
        const imageExists = fs.existsSync(imagePath);

        // Assign Gate 2 role
        await assignGateRole(member, 2);

        // Complete in database - store both answer and echo
        const result = userOps.completeGate(member.id, 2, {
            gate_2_answer: answer,
            gate_2_echo: echo,
        });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 2`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 2 with answer: ${answer}`);
        if (echo) {
            console.log(`  Echo: ${echo.substring(0, 50)}...`);
        }

        // Build success embed
        const successEmbed = new RitualEmbedBuilder(2, { mood: 'soft' })
            .setRitualTitle('[ M̷e̸m̵o̶r̷y̸ R̶e̷s̸t̵o̶r̷e̸d̵ ]')
            .setIkaMessage(maybeGlitch(messages.gate2.success || "you remembered... you actually remembered"))
            .addProgressVisualization(3)
            .setRitualFooter('the fragment solidifies');

        successEmbed.applyGlitchEffect(0.15);

        // Send success
        if (imageExists) {
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate2_lips.png' });
            successEmbed.setImage('attachment://gate2_lips.png');
            await interaction.editReply({ embeds: [successEmbed.build()], files: [attachment] });
        } else {
            await interaction.editReply({ embeds: [successEmbed.build()] });
        }

    } catch (error) {
        console.error('Gate 2 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'glitching' })
            .setRitualTitle('█▓░ error ░▓█')
            .setIkaMessage('something went wrong... try again?')
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Get a hint based on how wrong the answer was
 */
function getWrongAnswerHint(answer) {
    const lowerAnswer = answer.toLowerCase().trim();

    // Close answers get encouraging hints
    const closeAnswers = ['warm', 'nice', 'comfort', 'love', 'care', 'safe', 'seen'];
    const isClose = closeAnswers.some(a => lowerAnswer.includes(a));

    if (isClose) {
        return "*you're close... the feeling is warmer than that*";
    }

    // Completely wrong gets mysterious response
    return "*dig deeper... what did it really feel like?*";
}

module.exports = {
    startMemory,
    handleButton,
    handleModal,
};
