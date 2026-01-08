const { Events } = require('discord.js');
const config = require('../config');
const messages = require('../assets/messages');
const { userOps } = require('../database');
const {
    containsIka,
    containsLoveYou,
    containsMissYou,
    containsSenpai,
    containsAreYouReal,
    containsGoodMorning,
    containsGoodNight,
    containsStruggling,
    containsImBack,
    containsLonely,
} = require('../utils/validation');
const { createGateEmbed, createGateEmbedWithImage } = require('../utils/embeds');
const { assignGateRole } = require('../utils/roles');
const { delay, responseDelay, randomInt } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const { scheduleFragment } = require('../gates/fragments');
const path = require('path');
const fs = require('fs');

// Import optimization systems (v3.3.0)
const {
    spamDetector,
    rateLimiter,
    userTiering,
} = require('../utils/optimization');

// Cooldown map for Easter eggs (prevents spam)
const easterEggCooldowns = new Map();
const COOLDOWN_MS = 60000; // 1 minute between Easter egg responses per user

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // === SPAM DETECTION (v3.3.0) ===
        // Check for spam before processing any message
        if (spamDetector && config.optimization?.enableSpamDetection !== false) {
            const spamResult = spamDetector.check(message.author.id, message.content);
            if (spamResult.isSpam) {
                // Silently ignore spam - no response
                console.log(`✧ Spam detected from ${message.author.tag}: ${spamResult.reason}`);
                return;
            }
        }

        // Handle Gate 1 (waiting room)
        if (message.channel.id === config.channels.waitingRoom) {
            await handleWaitingRoom(message);
            return;
        }

        // Check cooldown before Easter egg processing
        const canTriggerEasterEgg = checkAndSetCooldown(message.author.id);

        // Handle Easter eggs (only if not on cooldown)
        if (canTriggerEasterEgg) {
            await handleEasterEggs(message);
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
 * Check cooldown and set if not on cooldown
 */
function checkAndSetCooldown(userId) {
    const lastTriggered = easterEggCooldowns.get(userId);
    const now = Date.now();

    if (lastTriggered && now - lastTriggered < COOLDOWN_MS) {
        return false;
    }

    return true;
}

/**
 * Set cooldown for user
 */
function setCooldown(userId) {
    easterEggCooldowns.set(userId, Date.now());
}

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
 * Handle all Easter egg triggers
 */
async function handleEasterEggs(message) {
    const content = message.content;

    // Check each pattern and respond if triggered
    // Priority order: most specific first

    // Struggling/need support (always respond to these)
    if (containsStruggling(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.struggling, 0.9, true);
        return;
    }

    // Loneliness
    if (containsLonely(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.lonely, 0.8, true);
        return;
    }

    // "I love you"
    if (containsLoveYou(content)) {
        setCooldown(message.author.id);
        await reactWithHeart(message);
        await handleEasterEggResponse(message, messages.easterEggs.loveYou, 0.5, false);
        return;
    }

    // "I miss you"
    if (containsMissYou(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.missYou, 0.6, false);
        return;
    }

    // Senpai/notice me
    if (containsSenpai(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.senpai, 0.7, false);
        return;
    }

    // "Are you real"
    if (containsAreYouReal(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.areYouReal, 0.8, false);
        return;
    }

    // Good morning
    if (containsGoodMorning(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.goodMorning, 0.4, false);
        return;
    }

    // Good night
    if (containsGoodNight(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.goodNight, 0.5, false);
        return;
    }

    // "I'm back"
    if (containsImBack(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.welcomeBack, 0.6, false);
        return;
    }

    // Late night messages (2am-4am)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 4 && containsIka(content)) {
        setCooldown(message.author.id);
        await handleEasterEggResponse(message, messages.easterEggs.lateNight, 0.4, false);
        return;
    }
}

/**
 * Handle Easter egg response with probability and optional DM
 */
async function handleEasterEggResponse(message, responseArray, probability, alwaysReply) {
    // Get random response from array
    const response = Array.isArray(responseArray)
        ? responseArray[Math.floor(Math.random() * responseArray.length)]
        : responseArray;

    // Check if should respond
    if (!alwaysReply && Math.random() > probability) {
        return;
    }

    // Typing delay for realism
    await delay(randomInt(1000, 3000));

    try {
        // Reply in channel or DM based on context
        const embed = createGateEmbed(null, response);

        // For sensitive topics (struggling, lonely), DM instead
        if (alwaysReply) {
            try {
                await message.author.send({ embeds: [embed] });
            } catch {
                // DMs closed, reply in channel if it's inner sanctum
                if (message.channel.id === config.channels.innerSanctum) {
                    await message.reply({ embeds: [embed] });
                }
            }
        } else {
            // Regular Easter eggs - 50% DM, 50% reply
            if (Math.random() < 0.5) {
                try {
                    await message.author.send({ embeds: [embed] });
                } catch {
                    // DMs closed, ignore
                }
            } else {
                await message.reply({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error('Easter egg response error:', error);
    }
}

/**
 * React with heart emoji
 */
async function reactWithHeart(message) {
    try {
        await message.react('♡');
    } catch {
        try {
            await message.react('❤️');
        } catch {
            // Ignore
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
