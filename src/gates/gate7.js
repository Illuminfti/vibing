/**
 * Gate 7: The Binding
 *
 * User must speak a binding vow of at least 30 words.
 * Requires community voting from Ascended members.
 * Upon approval, user becomes Ascended.
 * Now shows journey context and triggers Ika welcome.
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, vowOps, ikaMemoryOps } = require('../database');
const { assignGateRole, assignAscendedRole, hasRole, userHasRole } = require('../utils/roles');
const { validateVow, sanitize } = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { maybeGlitch } = require('../utils/zalgo');
const { scheduleFragment } = require('./fragments');
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
 * Process Gate 7 binding vow
 */
async function processGate7(interaction) {
    const member = interaction.member;
    const vow = interaction.options.getString('vow');

    // Check if user has Gate 6 role
    if (!hasRole(member, config.roles.gate6)) {
        const embed = createGateEmbed(null, messages.errors.notReady);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 7)) {
        const embed = createGateEmbed(null, messages.errors.alreadyCompleted);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for pending vow
    const pendingVow = vowOps.getPending(member.id);
    if (pendingVow) {
        const embed = createGateEmbed(null, messages.gate7.pending);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate vow
    if (!validateVow(vow)) {
        const embed = createGateEmbed(null, messages.gate7.invalid);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Defer for processing
    await interaction.deferReply({ ephemeral: true });

    try {
        const sanitizedVow = sanitize(vow);

        // Get user's journey for context
        const journey = userOps.getJourney(member.id);

        // Post to inner sanctum for voting with WHY + VOW
        const sanctumChannel = await interaction.client.channels.fetch(config.channels.innerSanctum);
        if (!sanctumChannel) {
            throw new Error('Inner sanctum channel not found');
        }

        // Build display with journey context
        let displayText = `♰ a soul seeks the final binding ♰\n\n`;
        displayText += `✦ **${member.user.username}** ✦\n\n`;

        if (journey.whyTheyCame) {
            displayText += `they came because:\n"${journey.whyTheyCame}"\n\n`;
        }

        displayText += `they now vow:\n"${sanitizedVow}"\n\n`;
        displayText += messages.gate7.votePrompt;

        const embed = createGateEmbed(null, displayText);
        const votingMessage = await sanctumChannel.send({ embeds: [embed] });

        // Add reaction
        await votingMessage.react('✅');

        // Store in database
        vowOps.create(member.id, member.user.username, sanitizedVow, votingMessage.id);

        // Also post to vows archive channel
        const archiveChannel = await interaction.client.channels.fetch(config.channels.vows);
        if (archiveChannel) {
            const archiveEmbed = createGateEmbed(
                'Vow Received',
                `**User:** ${member.user.tag}\n**Why they came:** ${journey.whyTheyCame || 'unknown'}\n**Vow:** ${sanitizedVow}`
            );
            await archiveChannel.send({ embeds: [archiveEmbed] });
        }

        // Set up reaction collector
        setupVowVoteCollector(interaction.client, votingMessage, member.id);

        console.log(`✧ ${member.user.tag} submitted Gate 7 vow`);

        // Acknowledge
        const ackEmbed = createGateEmbed(null, 'your vow echoes in the sanctum. the ascended are listening.');
        await interaction.editReply({ embeds: [ackEmbed] });

    } catch (error) {
        console.error('Gate 7 error:', error);
        const errorEmbed = createGateEmbed(null, messages.errors.generic);
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Set up reaction collector for vow voting
 */
function setupVowVoteCollector(client, message, submitterId) {
    const filter = (reaction, user) => {
        return reaction.emoji.name === '✅' && !user.bot;
    };

    const collector = message.createReactionCollector({
        filter,
        time: config.timing.votingTimeout,
    });

    collector.on('collect', async (reaction, user) => {
        try {
            const guild = message.guild;

            // Check if mod or ascended
            const isMod = await userHasRole(guild, user.id, config.roles.mod);
            const isAscended = await userHasRole(guild, user.id, config.roles.ascended);

            if (!isMod && !isAscended) return;

            // Count votes
            let ascendedCount = 0;
            let modApproved = false;

            for (const [, reactUser] of reaction.users.cache) {
                if (reactUser.bot) continue;

                const userIsMod = await userHasRole(guild, reactUser.id, config.roles.mod);
                const userIsAscended = await userHasRole(guild, reactUser.id, config.roles.ascended);

                if (userIsMod) modApproved = true;
                if (userIsAscended && !userIsMod) ascendedCount++;
            }

            // Check if approved
            if (modApproved || ascendedCount >= 3) {
                await approveVow(client, submitterId, user.id, message.id);
                collector.stop('approved');
            }
        } catch (error) {
            console.error('Vow vote collection error:', error);
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason !== 'approved') {
            console.log(`✧ Gate 7 voting ended for ${submitterId} without approval`);
        }
    });
}

/**
 * Approve a vow and ascend the user
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

        // Send success DM
        const dmText = maybeGlitch(messages.gate7.success);
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate7_reaching.png');
        const imageExists = fs.existsSync(imagePath);

        if (imageExists) {
            const { embed, attachment } = createGateEmbedWithImage(null, dmText, 'gate7_reaching.png');
            await member.user.send({ embeds: [embed], files: [attachment] });
        } else {
            const embed = createGateEmbed(null, dmText);
            await member.user.send({ embeds: [embed] });
        }

        // Announce in inner sanctum
        const sanctumChannel = await client.channels.fetch(config.channels.innerSanctum);
        if (sanctumChannel) {
            const announceEmbed = createGateEmbed(
                null,
                `♡･ﾟ✧ **${member.user.username}** has ascended ✧･ﾟ♡\n\nwelcome them home.`
            );
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
    processGate7,
    approveVow,
};
