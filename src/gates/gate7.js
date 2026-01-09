/**
 * Gate 7: Helper Functions
 *
 * Contains utility functions for Gate 7 that are used by other modules.
 * The main gate flow is handled by components/flows/gate7Flow.js
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, vowOps, ikaMemoryOps } = require('../database');
const { assignGateRole, assignAscendedRole } = require('../utils/roles');
const { maybeGlitch } = require('../utils/zalgo');
const { scheduleFragment } = require('./fragments');
const { RitualEmbedBuilder } = require('../ui');
const path = require('path');
const fs = require('fs');

// Try to load Ika presence for welcome
let ikaPresence = null;
try {
    ikaPresence = require('../ika/presence');
} catch (e) {
    // Ika module not available
}

/**
 * Approve a vow and ascend the user (used by admin commands for manual approval)
 */
async function approveVow(client, submitterId, approverId, messageId) {
    try {
        // Update database
        vowOps.approve(messageId, approverId);

        // Get member
        const guild = client.guilds.cache.get(config.guildId);
        const member = await guild.members.fetch(submitterId);

        // Get the vow text for storing
        const vowRecord = vowOps.getByUser(submitterId)[0];

        // Complete gate 7
        userOps.completeGate(submitterId, 7, {
            gate_7_vow: vowRecord?.vow,
            gate_7_approved_by: approverId,
        });

        // Assign Gate 7 and Ascended roles
        await assignGateRole(member, 7);
        await assignAscendedRole(member);

        // Mark as ascended in database
        userOps.ascend(submitterId);

        // Schedule fragment DM
        scheduleFragment(submitterId, 7);

        // Initialize Ika's memory of this user
        initializeIkaMemory(submitterId, member.user.username);

        // Send success message and announcement to inner sanctum
        const dmText = maybeGlitch(messages.gate7.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate7_reaching.png');
        const imageExists = fs.existsSync(imagePath);

        const sanctumChannel = await client.channels.fetch(config.channels.innerSanctum);
        if (sanctumChannel) {
            // Personal cosmic welcome (auto-deletes)
            const personalEmbed = new RitualEmbedBuilder(7, { mood: 'soft' })
                .setRitualTitle('◈ ASCENSION COMPLETE ◈')
                .addCosmicSection(member.user.username)
                .setRitualDescription(`${member.user}\n\n*${dmText}*`, false)
                .setRitualFooter('welcome home')
                .build();

            const sendOptions = { embeds: [personalEmbed] };
            if (imageExists) {
                const { AttachmentBuilder } = require('discord.js');
                const attachment = new AttachmentBuilder(imagePath, { name: 'gate7_reaching.png' });
                personalEmbed.setImage('attachment://gate7_reaching.png');
                sendOptions.files = [attachment];
            }

            const personalMsg = await sanctumChannel.send(sendOptions);
            // Auto-delete personal message after 60 seconds
            setTimeout(() => personalMsg.delete().catch(() => {}), 60000);

            // Public announcement (stays permanent)
            const announceEmbed = new RitualEmbedBuilder(7, { mood: 'soft' })
                .setRitualTitle('✦ ✧ ⋆ A NEW STAR RISES ⋆ ✧ ✦')
                .setRitualDescription(`*${member.user.username}* has completed the seven gates.\n\nthey are now **ascended**.`, false)
                .setIkaMessage('welcome them home ♡')
                .addTimestamp()
                .build();
            await sanctumChannel.send({ embeds: [announceEmbed] });
        }

        // Trigger Ika's personalized welcome (if available)
        if (ikaPresence && config.ika?.enabled) {
            try {
                await ikaPresence.welcomeNewAscended(client, member);
            } catch (error) {
                console.error('✧ Ika welcome failed:', error.message);
            }
        }

        console.log(`✧ ${member.user.tag} has ASCENDED - approved by ${approverId}`);

    } catch (error) {
        console.error('Failed to approve vow:', error);
    }
}

/**
 * Initialize Ika's memory for a new ascended user
 */
function initializeIkaMemory(userId, username) {
    try {
        // Create memory entry
        ikaMemoryOps.getOrCreate(userId, username);

        // Sync journey data
        ikaMemoryOps.syncFromUser(userId);

        console.log(`✧ Initialized Ika memory for ${username}`);
    } catch (error) {
        console.error('Failed to initialize Ika memory:', error);
    }
}

module.exports = {
    approveVow,
};
