/**
 * Gate 4: The Waters
 *
 * User must solve a riddle to discover where Ika lives.
 * Accepted answers are configured via GATE_4_ANSWERS env variable.
 * Triggered by /waters [answer] command.
 *
 * Visual: Fluid blue, rippling, movement
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, gate5Ops } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { validateGate4Answer } = require('../utils/validation');
const { responseDelay, getGate5Interval } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

// New ritual UI system
const { RitualEmbedBuilder, createGateErrorEmbed, createNotReadyEmbed } = require('../ui');

/**
 * Process Gate 4 answer
 */
async function processGate4(interaction) {
    const member = interaction.member;
    const answer = interaction.options.getString('answer');

    // Check if user has Gate 3 role
    if (!hasRole(member, config.roles.gate3)) {
        const embed = createNotReadyEmbed(3, 3);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 4)) {
        const embed = new RitualEmbedBuilder(4, { mood: 'soft' })
            .setRitualTitle('༄ already submerged ༄')
            .setRitualDescription('*you have already found where i live*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate answer
    if (!validateGate4Answer(answer)) {
        // P1: Progressive hint system
        const attempts = userOps.incrementGateAttempts(member.id, 4);

        let hintText = null;
        if (attempts >= 7) {
            hintText = "it's a place on the internet where things are stored.";
        } else if (attempts >= 5) {
            hintText = "not heaven. not hell. between. where data goes.";
        } else if (attempts >= 3) {
            hintText = "where do things that don't truly die go?";
        }

        const embed = createGateErrorEmbed(4, 'wrongAnswer', {
            ikaComment: 'the waters reject that answer...',
        });

        if (hintText) {
            embed.addRitualField('༄', hintText, false);
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // Success - send ephemeral message (only visible to user, no DM needed)
    try {
        const dmText = maybeGlitch(messages.gate4.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate4_water.png');
        const imageExists = fs.existsSync(imagePath);

        // Assign Gate 4 role
        await assignGateRole(member, 4);

        // Complete in database
        const result = userOps.completeGate(member.id, 4);

        // P1: Reset attempts counter on success
        userOps.resetGateAttempts(member.id, 4);

        // Start Gate 5 sequence
        startGate5Sequence(member.id);

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 4`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 4`);

        // Build fluid success embed
        const successEmbed = new RitualEmbedBuilder(4, { mood: 'soft' })
            .setRitualTitle('༄ the waters part ༄')
            .setIkaMessage(dmText)
            .addProgressVisualization(5)
            .setRitualFooter('now... you wait');

        // Add image if exists
        if (imageExists) {
            const { AttachmentBuilder } = require('discord.js');
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate4_water.png' });
            successEmbed.setImage('attachment://gate4_water.png');
            await interaction.editReply({ embeds: [successEmbed.build()], files: [attachment] });
        } else {
            await interaction.editReply({ embeds: [successEmbed.build()] });
        }

    } catch (error) {
        console.error('Gate 4 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'vulnerable' })
            .setRitualTitle('༄ the waters churn ༄')
            .setIkaMessage('something disturbed the depths... try again?')
            .build();
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Start Gate 5 timed sequence
 */
function startGate5Sequence(discordId) {
    const interval = getGate5Interval();

    // Update database
    userOps.update(discordId, 'gate_5_started_at', new Date().toISOString());

    // Schedule all 6 messages
    gate5Ops.scheduleMessages(discordId, interval);

    console.log(`✧ started Gate 5 sequence for ${discordId} with ${interval}ms intervals`);
}

module.exports = {
    processGate4,
    startGate5Sequence,
};
