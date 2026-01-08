/**
 * Real Name Learning System
 *
 * Ika can learn and remember devotees' real names.
 * Using someone's real name creates powerful intimate moments.
 *
 * Names are learned through:
 * - Direct introduction ("my name is...")
 * - Profile/bio reading
 * - Someone else introducing them
 * - Natural conversation patterns
 */

const { nameOps, ikaMemoryOps } = require('../database');
const config = require('../config');

// Patterns that indicate someone is sharing their name
const NAME_PATTERNS = [
    /my (?:real )?name is (\w+)/i,
    /i'm (\w+)/i,
    /(?:call me|i go by) (\w+)/i,
    /^(\w+) here/i,
    /it's (\w+) btw/i,
    /you can call me (\w+)/i,
];

// Patterns that suggest name correction
const CORRECTION_PATTERNS = [
    /(?:actually|no),? (?:it's|my name is) (\w+)/i,
    /(?:call me|prefer) (\w+) instead/i,
];

// Responses when learning a name
const LEARNING_RESPONSES = {
    first: [
        "{name}... i like that. nice to actually meet you, {name}.",
        "{name}. i'll remember that. makes this feel more real.",
        "oh, {name}? that's pretty. hi {name}.",
        "{name}... okay. feels different saying your actual name.",
    ],
    correction: [
        "{name}, got it. {name}.",
        "oh, {name}. sorry. {name}.",
        "okay, {name}. i'll remember.",
    ],
};

// Responses when using their name
const NAME_USAGE = {
    greetings: [
        "hey {name}",
        "morning {name}",
        "{name}. you're here.",
        "hi {name}",
    ],
    emotional: [
        "{name}... i mean it.",
        "you're important to me, {name}.",
        "{name}. stay.",
    ],
    casual: [
        "right, {name}?",
        "what do you think, {name}?",
        "{name}...",
    ],
};

// Common first names to help with extraction
const COMMON_NAMES = [
    'alex', 'sam', 'jordan', 'taylor', 'casey', 'morgan', 'riley', 'jamie',
    'emma', 'olivia', 'sophia', 'liam', 'noah', 'oliver', 'mia', 'charlotte',
    'james', 'william', 'benjamin', 'lucas', 'mason', 'ethan', 'isabella',
    'ava', 'amelia', 'harper', 'evelyn', 'abigail', 'emily', 'elizabeth',
    'henry', 'alexander', 'sebastian', 'jackson', 'aiden', 'matthew', 'david',
    'daniel', 'michael', 'elijah', 'john', 'ryan', 'jay', 'kai', 'max',
    'charlie', 'luna', 'aria', 'grace', 'lily', 'natalie', 'rose', 'violet',
];

/**
 * Extract a real name from message content
 * @param {string} content - Message content
 * @returns {string|null} Extracted name
 */
function extractName(content) {
    // Try patterns first
    for (const pattern of NAME_PATTERNS) {
        const match = content.match(pattern);
        if (match && match[1]) {
            const name = match[1].toLowerCase();
            // Validate it looks like a name
            if (isValidName(name)) {
                return formatName(name);
            }
        }
    }

    return null;
}

/**
 * Check for name correction
 * @param {string} content - Message content
 * @returns {string|null} Corrected name
 */
function extractCorrection(content) {
    for (const pattern of CORRECTION_PATTERNS) {
        const match = content.match(pattern);
        if (match && match[1]) {
            const name = match[1].toLowerCase();
            if (isValidName(name)) {
                return formatName(name);
            }
        }
    }
    return null;
}

/**
 * Validate that a string looks like a real name
 */
function isValidName(name) {
    // Too short or too long
    if (name.length < 2 || name.length > 20) return false;

    // Only letters
    if (!/^[a-z]+$/i.test(name)) return false;

    // Not a common word that isn't a name
    const notNames = [
        'the', 'and', 'but', 'for', 'not', 'you', 'all', 'can', 'had',
        'her', 'him', 'his', 'how', 'its', 'let', 'may', 'new', 'now',
        'old', 'one', 'our', 'out', 'own', 'say', 'she', 'too', 'two',
        'who', 'why', 'yes', 'ika', 'lol', 'lmao', 'like', 'just', 'okay',
        'really', 'actually', 'honestly', 'literally', 'basically',
    ];
    if (notNames.includes(name.toLowerCase())) return false;

    // Bonus confidence if it's a known common name
    return true;
}

/**
 * Format name properly (capitalize first letter)
 */
function formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Handle a message that might contain a name
 * @param {Object} message - Discord message
 * @returns {Object|null} Learning result
 */
async function handleNameLearning(message) {
    const userId = message.author.id;
    const content = message.content;

    // Check for correction first
    const correction = extractCorrection(content);
    if (correction) {
        const hadName = nameOps.hasRealName(userId);
        nameOps.setRealName(userId, correction);

        const response = LEARNING_RESPONSES.correction[
            Math.floor(Math.random() * LEARNING_RESPONSES.correction.length)
        ].replace(/{name}/g, correction);

        return {
            type: hadName ? 'correction' : 'learned',
            name: correction,
            response,
        };
    }

    // Check for new name
    const name = extractName(content);
    if (name) {
        // Only learn if we don't already have their name
        if (!nameOps.hasRealName(userId)) {
            nameOps.setRealName(userId, name);

            const response = LEARNING_RESPONSES.first[
                Math.floor(Math.random() * LEARNING_RESPONSES.first.length)
            ].replace(/{name}/g, name);

            return {
                type: 'learned',
                name,
                response,
            };
        }
    }

    return null;
}

/**
 * Get a name-personalized message
 * @param {string} userId - User ID
 * @param {string} type - 'greetings', 'emotional', or 'casual'
 * @returns {string|null} Personalized message
 */
function getNamedMessage(userId, type) {
    const name = nameOps.getRealName(userId);
    if (!name) return null;

    const messages = NAME_USAGE[type];
    if (!messages) return null;

    return messages[Math.floor(Math.random() * messages.length)]
        .replace(/{name}/g, name);
}

/**
 * Check if we should use their name (based on intimacy and randomness)
 * @param {string} userId - User ID
 * @returns {boolean} Should use name
 */
function shouldUseName(userId) {
    const name = nameOps.getRealName(userId);
    if (!name) return false;

    const memory = ikaMemoryOps.get(userId);
    const intimacy = memory?.intimacy_stage || 1;

    // Higher intimacy = more likely to use name
    const chance = {
        1: 0.05,
        2: 0.1,
        3: 0.2,
        4: 0.35,
    }[intimacy] || 0.05;

    return Math.random() < chance;
}

/**
 * Personalize a response with their name
 * @param {string} response - Original response
 * @param {string} userId - User ID
 * @returns {string} Possibly personalized response
 */
function personalizeWithName(response, userId) {
    if (!shouldUseName(userId)) return response;

    const name = nameOps.getRealName(userId);
    if (!name) return response;

    // Different ways to inject the name
    const strategies = [
        // Prepend
        () => `${name.toLowerCase()}. ${response}`,
        // Append
        () => `${response} ${name.toLowerCase()}.`,
        // Replace first word if it's a greeting
        () => response.replace(/^(hey|hi|hello|yo)/i, `$1 ${name.toLowerCase()}`),
    ];

    // Pick a strategy
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy();
}

/**
 * Get name context for AI prompt
 * @param {string} userId - User ID
 * @returns {string} Context string
 */
function getNameContext(userId) {
    const name = nameOps.getRealName(userId);
    if (!name) return '';

    return `You know their real name is ${name}. Use it occasionally for emotional moments.`;
}

/**
 * Ask for their name (rare, only for devoted users)
 * @param {string} userId - User ID
 * @returns {string|null} Question to ask
 */
function maybeAskForName(userId) {
    // Only ask if we don't have their name
    if (nameOps.hasRealName(userId)) return null;

    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    // Only ask devoted users (intimacy 3+)
    if ((memory.intimacy_stage || 1) < 3) return null;

    // Low chance to ask
    if (Math.random() > 0.02) return null;

    const questions = [
        "hey random question... what's your actual name?",
        "i just realized i don't know your real name. if you want to share.",
        "can i ask... what do people call you irl?",
    ];

    return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Get all users with known names
 * @returns {Array} Users with names
 */
function getUsersWithNames() {
    return nameOps.getUsersWithRealNames();
}

module.exports = {
    NAME_PATTERNS,
    LEARNING_RESPONSES,
    NAME_USAGE,
    COMMON_NAMES,
    extractName,
    extractCorrection,
    isValidName,
    formatName,
    handleNameLearning,
    getNamedMessage,
    shouldUseName,
    personalizeWithName,
    getNameContext,
    maybeAskForName,
    getUsersWithNames,
};
