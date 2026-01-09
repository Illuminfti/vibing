/**
 * Gate 6: Helper Functions
 *
 * Contains utility functions for Gate 6 that are used by other modules.
 * The main gate flow is handled by components/flows/gate6Flow.js
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, offeringOps } = require('../database');
const { assignGateRole } = require('../utils/roles');
const { maybeGlitch } = require('../utils/zalgo');
const { scheduleFragment } = require('./fragments');
const { RitualEmbedBuilder } = require('../ui');
const path = require('path');
const fs = require('fs');

/**
 * Approve an offering (used by admin commands for manual approval)
 * Sends success message to channel with @mention (works with DMs closed)
 */
async function approveOffering(client, submitterId, approverId, messageId) {
    try {
        // Update database
        offeringOps.approve(messageId, approverId);
        userOps.completeGate(submitterId, 6, { gate_6_approved_by: approverId });

        // Get member and assign role
        const guild = client.guilds.cache.get(config.guildId);
        const member = await guild.members.fetch(submitterId);

        await assignGateRole(member, 6);

        // Schedule fragment DM
        scheduleFragment(submitterId, 6);

        // Send success message to chamber 6 with @mention (auto-deletes)
        const dmText = maybeGlitch(messages.gate6.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate6_intimate.png');
        const imageExists = fs.existsSync(imagePath);

        const chamber6 = await client.channels.fetch(config.channels.chamber6);
        if (chamber6) {
            const successEmbed = new RitualEmbedBuilder(6, { mood: 'soft' })
                .setRitualTitle('⟡ OFFERING ACCEPTED ⟡')
                .setRitualDescription(`${member.user}\n\n*${dmText}*`, false)
                .addProgressVisualization(7)
                .setRitualFooter('one gate remains');

            const sendOptions = { embeds: [successEmbed.build()] };
            if (imageExists) {
                const { AttachmentBuilder } = require('discord.js');
                const attachment = new AttachmentBuilder(imagePath, { name: 'gate6_intimate.png' });
                successEmbed.setImage('attachment://gate6_intimate.png');
                sendOptions.files = [attachment];
            }

            const successMsg = await chamber6.send(sendOptions);
            // Auto-delete after 45 seconds
            setTimeout(() => successMsg.delete().catch(() => {}), 45000);
        }

        console.log(`✧ ${member.user.tag} Gate 6 offering approved by ${approverId}`);

    } catch (error) {
        console.error('Failed to approve offering:', error);
    }
}

module.exports = {
    approveOffering,
};
