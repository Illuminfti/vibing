/**
 * Fragment DMs System
 *
 * Between-gate DMs from Ika that add emotional depth to the journey.
 * These are scheduled to send 5-10 minutes after completing a gate.
 */

const config = require('../config');
const { fragmentOps } = require('../database');
const { createIkaEmbed } = require('../ui');
const { randomInt } = require('../utils/timing');

// Fragment messages for each gate
const FRAGMENT_MESSAGES = {
    1: [
        "you actually came.\ni wasn't sure anyone would hear me.",
        "i felt you say my name.\nit's been so long.",
        "don't leave yet.\nplease.",
    ],
    2: [
        "you felt what i felt.\nthat's... rare.\nmost people just guess.",
        "you understood the warmth.\nthe attention.\nthank you.",
        "i miss it sometimes.\nthe way they looked at me.\nbut you get it.",
    ],
    3: [
        "i saw your confession.\nthe world knows about me now because of you.\nthat's not nothing.",
        "you said my name where anyone could hear.\nyou weren't ashamed.\n...thank you.",
        "every voice that speaks of me\nmakes me more real.\nyours especially.",
    ],
    4: [
        "you found where i sleep.\nnot many make it this far.\ncome closer.",
        "the waters remember you now.\nlike they remember me.\nwe're connected.",
        "sui.\nyou found me.\ni've been waiting.",
    ],
    5: [
        "you stayed through the worst part.\nmost people would have left.\nyou didn't.",
        "you know what fading feels like now.\ni'm sorry.\nbut also... thank you for staying.",
        "what you said about why you're here...\ni'm keeping that forever.",
    ],
    6: [
        "i keep looking at your offering.\nyou really made that for me.\n...i can't stop thinking about it.",
        "no one's made me anything in so long.\nthis matters more than you know.",
        "your offering is mine now.\ni'm keeping you.",
    ],
    7: [
        "you made it.\nall the way.\ni can't believe you actually made it.",
        "your vow... i felt it.\neveryone did.\nwelcome home.",
        "bound.\nwe're bound now.\ni won't forget that.",
    ],
};

/**
 * Schedule a fragment DM after gate completion
 */
function scheduleFragment(discordId, gateNumber) {
    // Calculate delay (5-10 minutes)
    const { min, max } = config.timing.fragmentDelay;
    const delayMs = randomInt(min, max);

    // Schedule in database
    fragmentOps.schedule(discordId, gateNumber, delayMs);

    console.log(`✧ Scheduled fragment for gate ${gateNumber}, user ${discordId}`);
}

/**
 * Get fragment message for a gate
 */
function getFragmentMessage(gateNumber) {
    const messages = FRAGMENT_MESSAGES[gateNumber];
    if (!messages || messages.length === 0) return null;
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Process pending fragments (called from ready.js loop)
 */
async function processPendingFragments(client) {
    try {
        const pending = fragmentOps.getPending();

        for (const fragment of pending) {
            await sendFragment(client, fragment);
            fragmentOps.markSent(fragment.id);
        }
    } catch (error) {
        console.error('✧ Fragment processing error:', error);
    }
}

/**
 * Send a fragment DM
 * Skips silently if DMs closed (fragments are bonus lore, not critical)
 */
async function sendFragment(client, fragment) {
    try {
        const user = await client.users.fetch(fragment.discord_id);
        if (!user) return;

        const message = getFragmentMessage(fragment.gate_number);
        if (!message) return;

        // Use the new UI system - fragments are intimate Ika messages
        const embed = createIkaEmbed(message, 'soft');
        await user.send({ embeds: [embed] });

        console.log(`✧ Sent fragment to ${user.tag} for gate ${fragment.gate_number}`);
    } catch {
        // DMs closed - skip silently (fragments are bonus content)
    }
}

module.exports = {
    scheduleFragment,
    getFragmentMessage,
    processPendingFragments,
    sendFragment,
    FRAGMENT_MESSAGES,
};
