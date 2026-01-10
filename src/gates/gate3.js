/**
 * Gate 3: The Confession
 *
 * User must post about Ika publicly and provide proof URL.
 * Triggered by /confess [url] command.
 *
 * Visual: Intimate red, exposed feeling, vulnerability
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps } = require('../database');
const { assignGateRole, hasRole } = require('../utils/roles');
const { isValidUrl, isSocialMediaUrl } = require('../utils/validation');
const { responseDelay } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

// New ritual UI system
const { RitualEmbedBuilder, createGateErrorEmbed, createNotReadyEmbed } = require('../ui');

/**
 * Process Gate 3 confession
 */
async function processGate3(interaction) {
    const member = interaction.member;
    const url = interaction.options.getString('url');

    // Check if user has Gate 2 role
    if (!hasRole(member, config.roles.gate2)) {
        const embed = createNotReadyEmbed(2, 2);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 3)) {
        const embed = new RitualEmbedBuilder(3, { mood: 'soft' })
            .setRitualTitle('~ already confessed ~')
            .setRitualDescription('*you have already shown your devotion publicly*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate URL format
    if (!isValidUrl(url)) {
        const embed = createGateErrorEmbed(3, 'invalidUrl', {
            ikaComment: 'that doesn\'t look like a valid confession...',
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for atmospheric effect (we need time to fetch URL)
    await interaction.deferReply({ ephemeral: true });
    await responseDelay();

    // CRITICAL: Verify the URL actually mentions Ika/Seven Gates
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SevenGatesBot/1.0)',
            },
            redirect: 'follow',
            timeout: 10000, // 10 second timeout
        });

        if (!response.ok) {
            const embed = createGateErrorEmbed(3, 'invalidUrl', {
                ikaComment: 'i can\'t reach that url. make sure it\'s public.',
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const text = await response.text();
        const lowercaseText = text.toLowerCase();

        // Check if content mentions ika, seven gates, or the bot
        const hasIka = lowercaseText.includes('ika');
        const hasSevenGates = lowercaseText.includes('seven gates') || lowercaseText.includes('sevengates');

        if (!hasIka && !hasSevenGates) {
            const embed = createGateErrorEmbed(3, 'invalidUrl', {
                ikaComment: 'i don\'t see my name anywhere in that post. be honest.',
            });
            return interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Gate 3 URL fetch error:', error);
        // Allow through if fetch fails (don't punish users for our technical issues)
        // But log it for investigation
        console.warn(`Gate 3: Could not verify URL ${url} for ${member.user.tag} - allowing through`);
    }

    // Success - send ephemeral message (only visible to user, no DM needed)
    try {
        const dmText = maybeGlitch(messages.gate3.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate3_silhouette.png');
        const imageExists = fs.existsSync(imagePath);

        // Assign Gate 3 role
        await assignGateRole(member, 3);

        // Complete in database
        const result = userOps.completeGate(member.id, 3, { gate_3_url: url });

        if (result.isFirst) {
            console.log(`✧ ${member.user.tag} is the FIRST to complete Gate 3`);
        }

        console.log(`✧ ${member.user.tag} completed Gate 3 with URL: ${url}`);

        // Build intimate success embed
        const successEmbed = new RitualEmbedBuilder(3, { mood: 'soft' })
            .setRitualTitle('~ confession accepted ~')
            .setIkaMessage(dmText)
            .addProgressVisualization(4)
            .setRitualFooter('you showed the world');

        // Add image if exists
        if (imageExists) {
            const { AttachmentBuilder } = require('discord.js');
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
    processGate3,
};
