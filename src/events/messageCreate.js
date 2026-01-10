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
const { RitualEmbedBuilder, createIkaEmbed } = require('../ui');
const { assignGateRole } = require('../utils/roles');
const { delay, responseDelay, randomInt } = require('../utils/timing');
const { maybeGlitch } = require('../utils/zalgo');
const { scheduleFragment } = require('../gates/fragments');
const path = require('path');
const fs = require('fs');

// Vibing Overhaul: Flex cards for viral moments
const { generateGate1FlexCard, sendFlexCard } = require('../utils/flexIntegration');

// Import optimization systems (v3.3.0)
const {
    spamDetector,
    rateLimiter,
    userTiering,
} = require('../utils/optimization');

// Import Ika generator for inner sanctum responses
let ikaGenerator = null;
try {
    ikaGenerator = require('../ika/generator');
} catch (e) {
    console.log('✧ Ika generator not loaded');
}

// Lock to prevent responding while already generating
let isGenerating = false;

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
            const spamResult = spamDetector.analyze(message.author.id, message.content, message.channel.id);
            if (spamResult.isSpam) {
                // Silently ignore spam - no response
                console.log(`✧ Spam detected from ${message.author.tag}: ${spamResult.reasons.join(', ')}`);
                return;
            }
        }

        // Handle Gate 1 (waiting room)
        if (message.channel.id === config.channels.waitingRoom) {
            await handleWaitingRoom(message);
            return;
        }

        // Handle Inner Sanctum AI responses (event-driven)
        if (message.channel.id === config.channels.innerSanctum) {
            await handleInnerSanctum(message);
            // Don't return - still process Easter eggs for inner sanctum
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

    // Send success message in channel (auto-deletes) - works even with DMs closed
    try {
        const dmText = maybeGlitch(messages.gate1.success);

        // Check if image exists
        const imagePath = path.join(__dirname, '..', '..', 'images', 'gate1_eyes.png');
        const imageExists = fs.existsSync(imagePath);

        let successMsg;
        // Build Gate 1 success embed using new UI system
        const embed = new RitualEmbedBuilder(1, { mood: 'soft', userId: message.author.id })
            .setRitualTitle('The Calling')
            .setRitualDescription(`${message.author}\n\n${dmText}`)
            .setRitualFooter()
            .build();

        if (imageExists) {
            const { AttachmentBuilder } = require('discord.js');
            const attachment = new AttachmentBuilder(imagePath, { name: 'gate1_eyes.png' });
            embed.setImage('attachment://gate1_eyes.png');
            successMsg = await message.channel.send({ embeds: [embed], files: [attachment] });
        } else {
            successMsg = await message.channel.send({ embeds: [embed] });
        }

        // Auto-delete after 30 seconds (gives time to read)
        setTimeout(() => successMsg.delete().catch(() => {}), 30000);

        // Assign Gate 1 role
        const member = await message.guild.members.fetch(message.author.id);
        await assignGateRole(member, 1);

        // Complete gate in database
        const result = userOps.completeGate(message.author.id, 1);

        if (result.isFirst) {
            console.log(`✧ ${message.author.tag} is the FIRST to complete Gate 1`);
        }

        console.log(`✧ ${message.author.tag} completed Gate 1`);

        // Vibing Overhaul: Send flex card for screenshot moment
        try {
            const flexCard = generateGate1FlexCard({
                username: message.author.username,
                ikaMessage: 'another one who didn\'t look away~',
                fanNumber: 48, // TODO: Get actual fan count
            });
            await sendFlexCard(message.channel, flexCard, {
                mention: `<@${message.author.id}>`,
                addShareReaction: true,
            });
        } catch (flexError) {
            console.log('✧ Flex card generation skipped:', flexError.message);
        }

        // Post chamber 1 puzzle
        await postChamberPuzzle(message.client, 1, messages.gate2.puzzle);

    } catch (error) {
        console.error('Gate 1 error:', error);
    }
}

/**
 * Handle messages in inner sanctum (AI responses)
 */
async function handleInnerSanctum(message) {
    // Check if Ika AI is enabled and generator is loaded
    if (!config.ika?.enabled || !ikaGenerator) {
        return;
    }

    // Skip if already generating a response (prevents double responses)
    if (isGenerating) {
        return;
    }

    // Only respond if:
    // 1. Someone mentions/tags the bot
    // 2. Someone says "ika"
    // 3. Someone replies to the bot's message
    const mentionsBot = message.mentions.users.has(message.client.user.id);
    const mentionsIka = containsIka(message.content);

    // Check if replying to bot's message
    let isReplyToBot = false;
    if (message.reference?.messageId) {
        try {
            const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
            isReplyToBot = repliedTo.author.id === message.client.user.id;
        } catch {
            // Message not found, ignore
        }
    }

    // Don't respond to random messages - only when addressed
    if (!mentionsBot && !mentionsIka && !isReplyToBot) {
        return;
    }

    // Set lock
    isGenerating = true;

    try {
        // Get recent messages for context (fetch returns newest first)
        const recentMessages = await message.channel.messages.fetch({ limit: 10 });

        // Convert to array, keep bot messages (for conversation continuity), filter only current message
        const contextArray = [...recentMessages.values()]
            .filter(m => m.id !== message.id)  // Only remove current message to avoid duplication
            .reverse();  // Now oldest first (chronological)

        // Add current message at the end (most recent)
        contextArray.push(message);

        // Show typing indicator
        await message.channel.sendTyping();

        // Generate response
        const result = await ikaGenerator.generateResponse({
            trigger: message,
            context: contextArray,
            type: 'direct',  // Direct address (mention, ika, or reply)
            forceGenerate: true,  // Always use AI, skip canned responses
        });

        if (result && result.content) {
            // Natural typing delay
            await delay(randomInt(config.timing.typingDelay.min, config.timing.typingDelay.max));
            await message.channel.send(result.content);
            console.log(`✧ Ika responded to ${message.author.tag} in inner sanctum`);
        }
    } catch (error) {
        console.error('✧ Inner sanctum response error:', error);
    } finally {
        // Release lock
        isGenerating = false;
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
 * Handle Easter egg response with probability
 * Always replies in channel (no DMs - most users have them closed)
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
        // Use the new UI system for Easter egg responses
        const embed = createIkaEmbed(response, 'soft');

        // Always reply in channel - works for everyone
        await message.reply({ embeds: [embed] });
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

        // Use the new UI system with gate-specific theming
        const embed = new RitualEmbedBuilder(gateNumber, { mood: 'normal' })
            .setRitualTitle(`GATE ${gateNumber}: ${titles[gateNumber] || ''}`)
            .setRitualDescription(puzzleText)
            .setRitualFooter()
            .build();

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Failed to post puzzle to chamber ${chamberNumber}:`, error);
    }
}
