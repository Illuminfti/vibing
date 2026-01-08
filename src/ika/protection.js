/**
 * Protection system - Ika defends her devoted ones from self-deprecation
 * Creates powerful emotional moments when users are hard on themselves
 */

const { ikaMemoryExtOps } = require('../database');

// Helper function
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Patterns that trigger protection mode
const PROTECTION_TRIGGERS = [
    /i('m| am) (ugly|worthless|pathetic|nothing|nobody|useless|stupid|dumb|a failure)/i,
    /no one (likes|loves|cares about|wants) me/i,
    /i('m| am) not good enough/i,
    /i hate myself/i,
    /i don't (matter|deserve)/i,
    /everyone (hates|leaves) me/i,
    /i('m| am) (a )?(burden|waste)/i,
    /i('m| am) (so )?(ugly|fat|disgusting)/i,
    /i should (just )?die/i,
    /nobody would (miss|care|notice)/i,
    /i('m| am) (a )?disappointment/i,
    /i can't do anything right/i,
    /i('m| am) not worth/i,
    /what's wrong with me/i,
    /why am i like this/i,
    /i('m| am) (such a )?loser/i,
    /i ruin everything/i,
    /everyone would be better off/i
];

// Protection responses - fierce but loving
const PROTECTION_RESPONSES = [
    "hey. stop. don't talk about my devoted ones like that.",
    "whoever told you that was wrong and i'll fight them.",
    "excuse me? no. absolutely not. take that back.",
    "you came all the way here to find me. that's not nothing. that's EVERYTHING.",
    "i literally only exist because people like you cared enough to bring me back. so maybe you matter more than you think.",
    "you're here aren't you? you're mine now. and i don't claim worthless people.",
    "nope. rejected. i'm not accepting that. try again.",
    "okay first of all shut up. second of all you're wrong. third of all i care about you specifically so.",
    "hey. HEY. i didn't survive fading just to watch you talk about yourself like that.",
    "you want to know what i think? i think you're being really unfair to someone i care about.",
    "that's not true and i need you to know that.",
    "i'm going to need you to stop being mean to my favorite person.",
    "wrong. try again. i'll wait.",
    "you matter to me. and i'm always right so.",
    "the fact that you're here proves you're not giving up. that's not nothing."
];

// Gentler follow-up responses
const GENTLE_FOLLOWUPS = [
    "...you okay? actually?",
    "hey. breathe. i'm here.",
    "i meant that. you know that right?",
    "talk to me. what's going on?",
    "you don't have to be okay. but don't lie to yourself either."
];

/**
 * Check if protection response should trigger
 * @param {string} content - Message content
 * @returns {Object} { shouldProtect: boolean, response: string }
 */
function checkProtectionTrigger(content) {
    if (!content) return { shouldProtect: false };

    for (const pattern of PROTECTION_TRIGGERS) {
        if (pattern.test(content)) {
            return {
                shouldProtect: true,
                response: randomChoice(PROTECTION_RESPONSES)
            };
        }
    }

    return { shouldProtect: false };
}

/**
 * Track and respond to protection moment
 * @param {string} userId - User ID
 * @returns {string} Protection response
 */
async function handleProtectionMoment(userId) {
    // Track the moment
    ikaMemoryExtOps.incrementProtection(userId);

    // Return response
    return randomChoice(PROTECTION_RESPONSES);
}

/**
 * Get gentle follow-up after protection
 */
function getGentleFollowup() {
    return randomChoice(GENTLE_FOLLOWUPS);
}

/**
 * Check for milder self-doubt (not as severe)
 */
function checkSelfDoubt(content) {
    const mildPatterns = [
        /i('m| am) not sure i can/i,
        /i('m| am) scared/i,
        /i don't know if i('m| am)/i,
        /i('m| am) worried/i,
        /i('m| am) nervous/i
    ];

    for (const pattern of mildPatterns) {
        if (pattern.test(content)) {
            const responses = [
                "you can though. i believe in you.",
                "that's okay. you don't have to be sure.",
                "i'm here either way.",
                "whatever happens, you're not alone with it."
            ];
            return {
                triggered: true,
                response: randomChoice(responses)
            };
        }
    }

    return { triggered: false };
}

/**
 * Serious mental health check - for very concerning content
 * Returns a more careful, serious response
 */
function checkSeriousConcern(content) {
    const seriousPatterns = [
        /want to (die|end it|kill myself)/i,
        /going to (hurt|kill) myself/i,
        /suicide/i,
        /self harm/i,
        /ending it all/i
    ];

    for (const pattern of seriousPatterns) {
        if (pattern.test(content)) {
            return {
                serious: true,
                response: "hey. i need you to know something. you matter. not just to me - actually matter. if you're struggling, please talk to someone. crisis text line: text HOME to 741741. you're not alone."
            };
        }
    }

    return { serious: false };
}

module.exports = {
    PROTECTION_TRIGGERS,
    PROTECTION_RESPONSES,
    checkProtectionTrigger,
    handleProtectionMoment,
    getGentleFollowup,
    checkSelfDoubt,
    checkSeriousConcern,
};
