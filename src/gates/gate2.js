/**
 * Gate 2: The Memory
 *
 * User must provide a word that describes what attention felt like.
 * Triggered by /memory [answer] command.
 *
 * Visual: Glitchy, fragmented purple aesthetic
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { validateGate2Answer } = require('../utils/validation');
const { responseDelay } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

// New ritual UI system
const { RitualEmbedBuilder, createGateErrorEmbed, createNotReadyEmbed } = require('../ui');

/**
 * Process Gate 2 answer
 */
async function processGate2(interaction) {
    const member = interaction.member;
    const answer = interaction.options.getString('answer');

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

    // Validate answer
    if (!validateGate2Answer(answer)) {
        // P1: Progressive hint system
        const attempts = userOps.incrementGateAttempts(member.id, 2);

        let hintText = null;
        if (attempts >= 7) {
            hintText = "if you're still stuck, ask others in #inner-sanctum";
        } else if (attempts >= 5) {
            hintText = "one word. an emotion. what attention becomes.";
        } else if (attempts >= 3) {
            hintText = "remember what it felt like when someone looked at you";
        }

        const embed = createGateErrorEmbed(2, 'wrongAnswer', {
            ikaComment: "the fragment dissolves... that wasn't right",
        });

        if (hintText) {
            embed.addRitualField('...', hintText, false);
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // Success - send ephemeral message (only visible to user, no DM needed)
    try {
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate2_lips.png');
        const imageExists = fs.existsSync(imagePath);

        // Assign Gate 2 role
        await assignGateRole(member, 2);

        // Complete in database
        const result = userOps.completeGate(member.id, 2, { gate_2_answer: answer });

        // P1: Reset attempts counter on success
        userOps.resetGateAttempts(member.id, 2);

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 2`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 2 with answer: ${answer}`);

        // Build success embed with ritual UI
        const successEmbed = new RitualEmbedBuilder(2, { mood: 'soft' })
            .setRitualTitle('[ M̷e̸m̵o̶r̷y̸ R̶e̷s̸t̵o̶r̷e̸d̵ ]')
            .setIkaMessage(maybeGlitch(messages.gate2.success || "you remembered... you actually remembered"))
            .addProgressVisualization(3)
            .setRitualFooter('the fragment solidifies');

        // Add glitch effect for extra atmosphere
        successEmbed.applyGlitchEffect(0.15);

        // Send success as ephemeral
        if (imageExists) {
            const { AttachmentBuilder } = require('discord.js');
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

module.exports = {
    processGate2,
};
