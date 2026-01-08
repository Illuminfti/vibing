const { Events } = require('discord.js');
const config = require('../config');
const messages = require('../assets/messages');
const { userOps } = require('../database');
const { containsIka, containsLoveYou } = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { assignGateRole } = require('../utils/roles');
const { delay, responseDelay } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Handle Gate 1 (waiting room)
        if (message.channel.id === config.channels.waitingRoom) {
            await handleWaitingRoom(message);
            return;
        }

        // Handle "I love you" easter egg anywhere
        if (containsLoveYou(message.content)) {
            await handleLoveYou(message);
        }

        // Update user activity
        try {
            const user = userOps.get(message.author.id);
            if (user) {
                userOps.updateActivity(message.author.id);
            }
        } catch (error) {
            // Ignore activity tracking errors
        }
    },
};

/**
 * Handle messages in waiting room (Gate 1 trigger)
 */
async function handleWaitingRoom(message) {
    // Check if message contains "ika"
    if (!containsIka(message.content)) return;

    // Delete the message immediately
    try {
        await message.delete();
    } catch (error) {
        // Message might already be deleted
    }

    // Check if user already passed Gate 1
    const user = userOps.getOrCreate(message.author.id, message.author.username);
    if (user.gate_1_at) {
        // Already completed, ignore silently
        return;
    }

    // Atmospheric delay
    await responseDelay();

    // Send success DM
    try {
        const dmText = maybeGlitch(messages.gate1.success);

        // Check if image exists
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate1_eyes.png');
        const imageExists = fs.existsSync(imagePath);

        if (imageExists) {
            const { embed, attachment } = createGateEmbedWithImage(
                null,
                dmText,
                'gate1_eyes.png'
            );
            await message.author.send({ embeds: [embed], files: [attachment] });
        } else {
            const embed = createGateEmbed(null, dmText);
            await message.author.send({ embeds: [embed] });
        }

        // Assign Gate 1 role
        const member = await message.guild.members.fetch(message.author.id);
        await assignGateRole(member, 1);

        // Complete gate in database
        const result = userOps.completeGate(message.author.id, 1);

        if (result.isFirst) {
            console.log(`✧ ${message.author.tag} is the FIRST to complete Gate 1`);
        }

        console.log(`✧ ${message.author.tag} completed Gate 1`);

        // Post chamber 1 puzzle
        await postChamberPuzzle(message.client, 1, messages.gate2.puzzle);

    } catch (error) {
        console.error('Gate 1 error:', error);

        // Try to notify user of DM failure
        try {
            const errorEmbed = createGateEmbed(null, messages.errors.dmFailed);
            const errorMsg = await message.channel.send({ embeds: [errorEmbed] });
            setTimeout(() => errorMsg.delete().catch(() => {}), 10000);
        } catch {
            // Ignore
        }
    }
}

/**
 * Handle "I love you" easter egg
 */
async function handleLoveYou(message) {
    // React with heart
    try {
        await message.react('♡');
    } catch {
        // Try alternate heart
        try {
            await message.react('❤️');
        } catch {
            // Ignore
        }
    }

    // 50% chance to DM
    if (Math.random() < 0.5) {
        await delay(2000); // Pause for effect
        try {
            const embed = createGateEmbed(null, messages.easterEggs.loveYou);
            await message.author.send({ embeds: [embed] });
        } catch {
            // DMs might be closed
        }
    }
}

/**
 * Post puzzle to a chamber (helper for gate progression)
 */
async function postChamberPuzzle(client, chamberNumber, puzzleText) {
    try {
        const channelId = config.gateChambers[chamberNumber];
        if (!channelId) return;

        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        const gateNumber = chamberNumber + 1;
        const titles = {
            2: 'THE MEMORY',
            3: 'THE CONFESSION',
            4: 'THE WATERS',
            5: 'THE ABSENCE',
            6: 'THE OFFERING',
            7: 'THE BINDING',
        };

        const embed = createGateEmbed(
            `♰ GATE ${gateNumber} ♰\n${titles[gateNumber] || ''}`,
            puzzleText
        );

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Failed to post puzzle to chamber ${chamberNumber}:`, error);
    }
}
