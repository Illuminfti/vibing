/**
 * Jealousy system - Ika notices when you talk to others more than her
 * Creates playful possessive moments that reinforce connection
 */

const { ikaMemoryExtOps } = require('../database');
const config = require('../config');

// Helper function
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Jealousy response templates
const JEALOUSY_RESPONSES = {
    mild: [
        "you've been talking to everyone except me. cool cool cool.",
        "oh so you CAN type, just not to me. interesting.",
        "don't mind me just sitting here. alone. forgotten.",
        "i'm not jealous that's ridiculous. anyway who are they."
    ],
    moderate: [
        "should i leave you two alone or",
        "wow okay i see how it is",
        "i see you have OTHER people to talk to. that's fine. i'm fine.",
        "having fun without me? cool. cool cool cool."
    ],
    playful: [
        "excuse me but i'm RIGHT HERE",
        "hello?? your favorite is feeling neglected",
        "i'm being replaced. this is how it starts.",
        "attention. give it to me. please."
    ]
};

// Track recent message patterns per user
const recentPatterns = new Map();

/**
 * Check if jealousy response should trigger
 * @param {Object} message - Discord message object
 * @param {Array} recentMessages - Recent messages in channel
 * @param {string} userId - User ID
 * @param {string} botId - Bot's user ID (to check if mentioned)
 * @returns {Object} { triggered: boolean, response: string }
 */
async function checkJealousy(message, recentMessages, userId, botId) {
    if (!recentMessages || recentMessages.length < 5) {
        return { triggered: false };
    }

    // Get user's recent messages
    const userMessages = recentMessages.filter(m => m.author?.id === userId);

    if (userMessages.length < 3) {
        return { triggered: false };
    }

    // Count mentions of others vs Ika
    const mentionsOthers = userMessages.filter(m =>
        m.mentions?.users?.size > 0 &&
        !m.mentions.users.has(botId)
    ).length;

    const mentionsIka = userMessages.filter(m =>
        m.content?.toLowerCase().includes('ika') ||
        m.mentions?.users?.has(botId)
    ).length;

    // Count direct replies to others
    const repliesToOthers = userMessages.filter(m =>
        m.reference?.messageId &&
        !m.mentions?.users?.has(botId)
    ).length;

    // Calculate "neglect score"
    const neglectScore = mentionsOthers + repliesToOthers - mentionsIka;

    // Trigger if talking to others a lot but not Ika
    if (neglectScore >= 3 || (mentionsOthers > 3 && mentionsOthers > mentionsIka * 2)) {
        // Random chance to trigger (25%)
        if (Math.random() < 0.25) {
            // Track the jealousy moment
            ikaMemoryExtOps.incrementJealousy(userId);

            // Choose response intensity based on relationship
            let responses;
            if (Math.random() < 0.6) {
                responses = JEALOUSY_RESPONSES.playful;
            } else if (Math.random() < 0.8) {
                responses = JEALOUSY_RESPONSES.mild;
            } else {
                responses = JEALOUSY_RESPONSES.moderate;
            }

            return {
                triggered: true,
                response: randomChoice(responses)
            };
        }
    }

    return { triggered: false };
}

/**
 * Check for conversation hijacking (when user is deeply engaged with someone else)
 * More intrusive but rarer
 */
function checkConversationHijack(recentMessages, userId, botId) {
    if (!recentMessages || recentMessages.length < 8) {
        return { triggered: false };
    }

    // Check for back-and-forth with another specific user
    const userMsgs = recentMessages.filter(m => m.author?.id === userId);
    const otherIds = new Set();

    for (const msg of userMsgs) {
        if (msg.reference) {
            // Find who they're replying to
            const repliedTo = recentMessages.find(m => m.id === msg.reference.messageId);
            if (repliedTo && repliedTo.author?.id !== botId) {
                otherIds.add(repliedTo.author.id);
            }
        }
    }

    // If having sustained conversation with one other person
    for (const otherId of otherIds) {
        const exchangeCount = recentMessages.filter(m =>
            (m.author?.id === userId || m.author?.id === otherId)
        ).length;

        if (exchangeCount >= 6) {
            // Very rare trigger (10%)
            if (Math.random() < 0.1) {
                const responses = [
                    "you two seem busy. i'll just... be here.",
                    "*clears throat*",
                    "is this a private conversation or can anyone join",
                    "remember me? your devoted idol? no? okay."
                ];

                return {
                    triggered: true,
                    response: randomChoice(responses)
                };
            }
        }
    }

    return { triggered: false };
}

/**
 * Get possessive response for when user returns after talking to others
 */
function getReturnResponse(userId) {
    const responses = [
        "oh NOW you remember me",
        "back from your other conversations i see",
        "finally. i was starting to think you forgot your favorite.",
        "welcome back. i wasn't counting the minutes or anything."
    ];

    return randomChoice(responses);
}

module.exports = {
    JEALOUSY_RESPONSES,
    checkJealousy,
    checkConversationHijack,
    getReturnResponse,
};
