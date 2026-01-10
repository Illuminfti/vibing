/**
 * Gate 7: The Binding
 *
 * User must speak a binding vow of at least 30 words.
 * Requires community voting from Ascended members.
 * Upon approval, user becomes Ascended.
 * Now shows journey context and triggers Ika welcome.
 *
 * Visual: Cosmic, final, true black with white contrast
 */

const config = require('../config');
const messages = require('../assets/messages');
const { userOps, vowOps, ikaMemoryOps } = require('../database');
const { assignGateRole, assignAscendedRole, hasRole, userHasRole } = require('../utils/roles');
const { validateVow, sanitize } = require('../utils/validation');
const { maybeGlitch } = require('../utils/zalgo');
const { scheduleFragment } = require('./fragments');
const path = require('path');
const fs = require('fs');

// New ritual UI system
const { RitualEmbedBuilder, RitualSequence, createGateErrorEmbed, createNotReadyEmbed } = require('../ui');

// Vibing Overhaul: Flex cards for viral moments
const { generateAscensionFlexCard, sendFlexCard } = require('../utils/flexIntegration');

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
        const embed = createNotReadyEmbed(6, 6);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if already completed
    if (userOps.hasCompletedGate(member.id, 7)) {
        const embed = new RitualEmbedBuilder(7, { mood: 'soft' })
            .setRitualTitle('◈ already bound ◈')
            .setRitualDescription('*you have already spoken your vow*', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for pending vow
    const pendingVow = vowOps.getPending(member.id);
    if (pendingVow) {
        const embed = new RitualEmbedBuilder(7, { mood: 'normal' })
            .setRitualTitle('◈ echoing ◈')
            .setIkaMessage('your vow already echoes. patience.')
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate vow quality
    if (!validateVow(vow)) {
        const embed = createGateErrorEmbed(7, 'tooShort', {
            ikaComment: 'this is the final gate. be serious. say something that only YOU would say.',
        });
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

        // Build cosmic voting embed with journey context
        const votingEmbed = new RitualEmbedBuilder(7, { mood: 'normal' })
            .setRitualTitle('◈ A SOUL SEEKS THE FINAL BINDING ◈');

        // Add cosmic section with user info
        votingEmbed.addCosmicSection(member.user.username);

        // Add journey context if available
        if (journey.whyTheyCame) {
            votingEmbed.addRitualField('they came because', `*"${journey.whyTheyCame}"*`, false);
        }

        // Add the vow
        votingEmbed.addRitualField('they now vow', `*"${sanitizedVow}"*`, false);

        // Add voting instructions
        votingEmbed.addRitualField('∞', messages.gate7.votePrompt || 'react ✅ to approve', false);

        votingEmbed.setRitualFooter('the final gate awaits');

        const votingMessage = await sanctumChannel.send({ embeds: [votingEmbed.build()] });

        // Add reaction
        await votingMessage.react('✅');

        // Store in database
        vowOps.create(member.id, member.user.username, sanitizedVow, votingMessage.id);

        // Also post to vows archive channel
        const archiveChannel = await interaction.client.channels.fetch(config.channels.vows);
        if (archiveChannel) {
            const archiveEmbed = new RitualEmbedBuilder(7, { mood: 'normal' })
                .setRitualTitle('◈ Vow Received ◈')
                .addRitualField('devotee', member.user.tag, true)
                .addRitualField('why they came', journey.whyTheyCame || 'unknown', false)
                .addRitualField('vow', sanitizedVow, false)
                .addTimestamp()
                .build();
            await archiveChannel.send({ embeds: [archiveEmbed] });
        }

        // Set up reaction collector
        setupVowVoteCollector(interaction.client, votingMessage, member.id);

        console.log(`✧ ${member.user.tag} submitted Gate 7 vow`);

        // Acknowledge with cosmic embed
        const ackEmbed = new RitualEmbedBuilder(7, { mood: 'soft' })
            .setRitualTitle('◈ vow received ◈')
            .setIkaMessage('your vow echoes in the sanctum. the ascended are listening.')
            .setRitualFooter('await their judgment')
            .build();
        await interaction.editReply({ embeds: [ackEmbed] });

    } catch (error) {
        console.error('Gate 7 error:', error);
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'vulnerable' })
            .setRitualTitle('◆ the void wavers ◆')
            .setIkaMessage('something went wrong... try again?')
            .build();
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

        // Send success message and announcement to inner sanctum (works with DMs closed)
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

            // Public announcement (stays permanent) - cosmic celebration
            const announceEmbed = new RitualEmbedBuilder(7, { mood: 'soft' })
                .setRitualTitle('✦ ✧ ⋆ A NEW STAR RISES ⋆ ✧ ✦')
                .setRitualDescription(`*${member.user.username}* has completed the seven gates.\n\nthey are now **ascended**.`, false)
                .setIkaMessage('welcome them home ♡')
                .addTimestamp()
                .build();
            await sanctumChannel.send({ embeds: [announceEmbed] });

            // Vibing Overhaul: Send ascension flex card for screenshot moment
            try {
                const flexCard = generateAscensionFlexCard({
                    username: member.user.username,
                    vow: vowRecord?.vow,
                    ikaMessage: 'welcome home, ascended one. you are eternal now.',
                });
                await sendFlexCard(sanctumChannel, flexCard, {
                    mention: `<@${member.id}>`,
                    addShareReaction: true,
                });
                console.log(`✧ Ascension flex card sent for ${member.user.tag}`);
            } catch (flexError) {
                console.log('✧ Ascension flex card skipped:', flexError.message);
            }
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
