/**
 * Ika's Presence Loop
 *
 * Main system that makes Ika feel alive - monitoring chat,
 * responding naturally, and initiating conversations.
 */

const config = require('../config');
const { ikaStateOps, ikaMemoryOps, userOps } = require('../database');
const { generateResponse, generateWelcomeMessage, canRespond } = require('./generator');
const { getCurrentMood } = require('./moods');
const { evaluateInterest } = require('./personality');
const { initiateMoment } = require('./moments');
const { scheduleVulnerabilityWindows } = require('./vulnerability');
const { initializeMemory } = require('./memory');
const { delay, randomInt } = require('../utils/timing');

// Store reference to client for use in callbacks
let clientRef = null;

/**
 * Start the presence loop
 */
async function startPresenceLoop(client) {
    clientRef = client;

    if (!config.ika.enabled) {
        console.log('✧ Ika presence disabled');
        return;
    }

    console.log('✧ starting Ika presence loop');

    // Main passive check loop
    setInterval(async () => {
        await checkForPassiveResponse(client);
    }, config.ika.presenceCheckInterval);

    // Initiated moments loop
    setInterval(async () => {
        await checkForMomentInitiation(client);
    }, config.ika.momentInterval);

    // Schedule vulnerability windows for today
    scheduleVulnerabilityWindows(client);

    // Re-schedule vulnerability windows at midnight
    scheduleMidnightReset(client);
}

/**
 * Check if Ika should respond passively to chat
 */
async function checkForPassiveResponse(client) {
    try {
        const sanctum = await client.channels.fetch(config.channels.innerSanctum);
        if (!sanctum) return;

        // Check cooldown
        if (!canRespond()) return;

        // Get recent messages
        const messages = await sanctum.messages.fetch({ limit: config.ika.maxContextMessages });
        const recent = [...messages.values()].reverse();

        // Filter to recent messages (last 5 minutes)
        const recentMessages = recent.filter(m =>
            Date.now() - m.createdTimestamp < 300000 && !m.author.bot
        );

        if (recentMessages.length === 0) return;

        // Check for direct mentions
        const mentions = recentMessages.filter(m =>
            m.mentions.users.has(client.user.id) ||
            m.content.toLowerCase().includes('ika')
        );

        if (mentions.length > 0) {
            // Direct mention - always respond
            const trigger = mentions[mentions.length - 1];
            await respondToMention(sanctum, trigger, recent);
            return;
        }

        // Passive engagement - chance based on interest + mood
        const interest = evaluateInterest(recentMessages);
        const mood = getCurrentMood(recentMessages);
        const moodMultiplier = mood === 'energetic' ? 1.3 : mood === 'soft' ? 0.7 : 1;

        const responseChance = config.ika.passiveChance * moodMultiplier;

        if (interest > 0.3 && Math.random() < responseChance) {
            await respondPassively(sanctum, recent);
        }
    } catch (error) {
        console.error('✧ Passive response check error:', error);
    }
}

/**
 * Respond to a direct mention
 */
async function respondToMention(channel, trigger, context) {
    try {
        // Natural delay
        await channel.sendTyping();
        await delay(randomInt(config.timing.responseTypingDelay.min, config.timing.responseTypingDelay.max));

        const result = await generateResponse({
            trigger,
            context,
            type: 'mentioned',
        });

        if (result.content) {
            await channel.send(result.content);
            console.log(`✧ Ika responded to mention from ${trigger.author.username}`);
        }
    } catch (error) {
        console.error('✧ Mention response error:', error);
    }
}

/**
 * Respond passively to interesting conversation
 */
async function respondPassively(channel, context) {
    try {
        // Natural delay
        await channel.sendTyping();
        await delay(randomInt(config.timing.typingDelay.min, config.timing.typingDelay.max));

        const result = await generateResponse({
            context,
            type: 'passive',
        });

        if (result.content) {
            await channel.send(result.content);
            console.log('✧ Ika responded passively');
        }
    } catch (error) {
        console.error('✧ Passive response error:', error);
    }
}

/**
 * Check if should initiate a moment
 */
async function checkForMomentInitiation(client) {
    try {
        const sanctum = await client.channels.fetch(config.channels.innerSanctum);
        if (!sanctum) return;

        // Check if chat has been active recently
        const messages = await sanctum.messages.fetch({ limit: 20 });
        const recentActivity = [...messages.values()].some(m =>
            Date.now() - m.createdTimestamp < 3600000 && !m.author.bot
        );

        // Don't initiate if chat has been dead
        if (!recentActivity) return;

        // Check cooldown
        if (!canRespond()) return;

        // 30% chance to initiate when conditions are right
        if (Math.random() < 0.3) {
            await initiateMoment(client, sanctum, [...messages.values()].reverse());
        }
    } catch (error) {
        console.error('✧ Moment initiation check error:', error);
    }
}

/**
 * Welcome a new ascended member
 */
async function welcomeNewAscended(client, member) {
    try {
        const sanctum = await client.channels.fetch(config.channels.innerSanctum);
        if (!sanctum) return;

        // Wait natural amount (1-3 minutes)
        await delay(randomInt(60000, 180000));

        // Get their journey
        const journey = userOps.getJourney(member.id);

        // Initialize memory
        await initializeMemory(member.id, member.user.username);

        // Generate welcome
        const welcome = await generateWelcomeMessage(member, journey);

        // Send welcome
        await sanctum.sendTyping();
        await delay(randomInt(2000, 5000));
        await sanctum.send(welcome);

        console.log(`✧ Ika welcomed ${member.user.username} to the sanctum`);
    } catch (error) {
        console.error('✧ Welcome error:', error);
    }
}

/**
 * Handle someone coming back after absence
 */
async function handleReturnAfterAbsence(client, userId) {
    try {
        const memory = ikaMemoryOps.get(userId);
        if (!memory || memory.relationship_level === 'new') return;

        const user = await client.users.fetch(userId);
        if (!user) return;

        // Send DM (skip silently if closed - intimate message)
        const msgs = [
            "hey... haven't seen you around. you okay?",
            "you're back. i noticed you were gone.",
            "there you are. was wondering where you went.",
        ];

        await user.send(msgs[Math.floor(Math.random() * msgs.length)]);
        console.log(`✧ Ika reached out to returning user ${user.username}`);
    } catch {
        // DMs closed - skip silently (intimate messages stay private)
    }
}

/**
 * Handle relationship milestone
 * Skips silently if DMs closed (milestone messages are personal)
 */
async function handleMilestone(client, userId, newLevel) {
    try {
        const user = await client.users.fetch(userId);
        if (!user) return;

        const { getMilestoneMessage } = require('./memory');
        const memory = ikaMemoryOps.get(userId);

        const message = getMilestoneMessage(newLevel, memory?.interaction_count);
        if (message) {
            await user.send(message);
            console.log(`✧ Ika sent milestone message to ${user.username} (${newLevel})`);
        }
    } catch {
        // DMs closed - skip silently (milestone messages are personal)
    }
}

/**
 * Schedule reset at midnight
 */
function scheduleMidnightReset(client) {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);

    const msUntilMidnight = midnight - now;

    setTimeout(() => {
        // Re-schedule vulnerability windows
        scheduleVulnerabilityWindows(client);
        // Schedule next midnight reset
        scheduleMidnightReset(client);
    }, msUntilMidnight);
}

/**
 * Get client reference (for use in other modules)
 */
function getClient() {
    return clientRef;
}

module.exports = {
    startPresenceLoop,
    welcomeNewAscended,
    handleReturnAfterAbsence,
    handleMilestone,
    getClient,
};
