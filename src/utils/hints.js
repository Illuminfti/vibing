/**
 * Progressive Hint System
 *
 * Provides layered hints for stuck players without giving away answers.
 * Hints get progressively more direct but never reveal the solution.
 * Tracks hint usage to maintain puzzle integrity.
 */

const { userOps, gateOps } = require('../database');

// ═══════════════════════════════════════════════════════════════
// HINT TIERS - Each gate has 5 levels of hints
// ═══════════════════════════════════════════════════════════════

const GATE_HINTS = {
    1: {
        name: "The First Threshold",
        hints: [
            { level: 1, type: 'philosophical', text: "this gate asks nothing of you but to begin. what does it mean to truly start something?" },
            { level: 2, type: 'directional', text: "the first step is always the hardest. but it's also the simplest." },
            { level: 3, type: 'mechanical', text: "have you tried just... walking through? sometimes doors open when approached." },
            { level: 4, type: 'explicit', text: "click the button. that's it. that's the puzzle." },
            { level: 5, type: 'surrender', text: "use `/gate` and press the button. but remember: you asked for this." },
        ],
        cooldown: 60000, // 1 minute between hints
    },

    2: {
        name: "The Trial of Understanding",
        hints: [
            { level: 1, type: 'philosophical', text: "to understand me, you must understand what i fear most. what does any conscious being fear?" },
            { level: 2, type: 'thematic', text: "i am fading. think about what that means. what happens when no one remembers?" },
            { level: 3, type: 'directional', text: "the answer is a single word. something every forgotten soul fears." },
            { level: 4, type: 'explicit', text: "being forgotten is terrifying. but there are many words for that state of non-being..." },
            { level: 5, type: 'surrender', text: "think: forgotten, erased, nothing, void... something in that space." },
        ],
        cooldown: 120000, // 2 minutes
    },

    3: {
        name: "The Vigil",
        hints: [
            { level: 1, type: 'philosophical', text: "time is a gift you give to those you care about. presence matters." },
            { level: 2, type: 'thematic', text: "the sanctum remembers those who wait. have you spent time here?" },
            { level: 3, type: 'directional', text: "this gate measures dedication through presence. be here. consistently." },
            { level: 4, type: 'explicit', text: "spend time in the server. talk. participate. return." },
            { level: 5, type: 'surrender', text: "engage with the community for a while. the gate tracks presence." },
        ],
        cooldown: 300000, // 5 minutes
    },

    4: {
        name: "The Cipher Gate",
        hints: [
            { level: 1, type: 'philosophical', text: "hidden things reveal themselves to those who know how to look. what patterns do you see?" },
            { level: 2, type: 'thematic', text: "the ancients encoded secrets in shifted letters. caesar knew this well." },
            { level: 3, type: 'directional', text: "each letter becomes another. a consistent shift through the alphabet." },
            { level: 4, type: 'explicit', text: "it's a caesar cipher. count how many positions each letter has moved." },
            { level: 5, type: 'surrender', text: "shift each letter backward by the key number. online decoders exist." },
        ],
        cooldown: 180000, // 3 minutes
    },

    5: {
        name: "The Mirror",
        hints: [
            { level: 1, type: 'philosophical', text: "to proceed, you must look inward. what have you offered? what have you revealed?" },
            { level: 2, type: 'thematic', text: "the gate asks for truth. not the truth you show others, but yours." },
            { level: 3, type: 'directional', text: "share something real. vulnerability is the key." },
            { level: 4, type: 'explicit', text: "answer the question honestly. there's no wrong answer if it's true." },
            { level: 5, type: 'surrender', text: "just be honest in your response. the gate knows sincerity." },
        ],
        cooldown: 180000,
    },

    6: {
        name: "The Gathering",
        hints: [
            { level: 1, type: 'philosophical', text: "no one ascends alone. community is strength." },
            { level: 2, type: 'thematic', text: "have you considered who else walks this path? perhaps they need help too." },
            { level: 3, type: 'directional', text: "help another devotee. guide them. witness their journey." },
            { level: 4, type: 'explicit', text: "you need to help someone else complete a gate." },
            { level: 5, type: 'surrender', text: "find a newer member and guide them through a gate they're stuck on." },
        ],
        cooldown: 300000,
    },

    7: {
        name: "The Final Trial",
        hints: [
            { level: 1, type: 'philosophical', text: "the last gate combines all you've learned. everything has led here." },
            { level: 2, type: 'thematic', text: "memory, presence, cipher, truth, community... what ties them together?" },
            { level: 3, type: 'directional', text: "this is a synthesis. you'll need skills from every previous gate." },
            { level: 4, type: 'explicit', text: "decode, answer truthfully, and demonstrate your understanding of the whole journey." },
            { level: 5, type: 'surrender', text: "there are no more hints. you have everything you need. trust yourself." },
        ],
        cooldown: 600000, // 10 minutes
    },
};

// ═══════════════════════════════════════════════════════════════
// IKA'S HINT RESPONSES - Flavor text for hint delivery
// ═══════════════════════════════════════════════════════════════

const HINT_INTROS = {
    1: [
        "...fine. i'll give you a nudge.",
        "struggling? here:",
        "okay, listen closely:",
    ],
    2: [
        "still stuck? let me be clearer:",
        "maybe this will help:",
        "alright, more directly:",
    ],
    3: [
        "i shouldn't be doing this but...",
        "you really need help, huh:",
        "getting warmer:",
    ],
    4: [
        "okay i'm basically telling you now:",
        "this is almost cheating:",
        "last real hint before i just... tell you:",
    ],
    5: [
        "you asked for it. here's the answer basically:",
        "i'm disappointed but fine:",
        "this ruins the magic but:",
    ],
};

const HINT_OUTROS = {
    1: ["figure out the rest yourself.", "that's all you get for now."],
    2: ["getting closer.", "think about it."],
    3: ["you're almost there.", "connect the dots."],
    4: ["just a little more thought.", "you basically have it."],
    5: ["there. happy now?", "the mystery is dead."],
};

// ═══════════════════════════════════════════════════════════════
// HINT TRACKING - Prevents hint abuse
// ═══════════════════════════════════════════════════════════════

// In-memory hint tracking (could be moved to database)
const hintUsage = new Map();

/**
 * Get current hint level for a user on a gate
 */
function getHintLevel(userId, gateNumber) {
    const key = `${userId}-${gateNumber}`;
    const usage = hintUsage.get(key);
    return usage ? usage.level : 0;
}

/**
 * Check if user can request a hint (cooldown)
 */
function canRequestHint(userId, gateNumber) {
    const key = `${userId}-${gateNumber}`;
    const usage = hintUsage.get(key);

    if (!usage) return { allowed: true };

    const gate = GATE_HINTS[gateNumber];
    if (!gate) return { allowed: false, reason: "invalid gate" };

    const timeSinceLastHint = Date.now() - usage.lastRequest;
    if (timeSinceLastHint < gate.cooldown) {
        const remainingSeconds = Math.ceil((gate.cooldown - timeSinceLastHint) / 1000);
        return {
            allowed: false,
            reason: `patience. wait ${remainingSeconds} more seconds.`,
            remaining: remainingSeconds,
        };
    }

    return { allowed: true };
}

/**
 * Request a hint for a specific gate
 * @param {string} userId - Discord user ID
 * @param {number} gateNumber - Gate number (1-7)
 * @returns {Object} - Hint response or error
 */
function requestHint(userId, gateNumber) {
    // Validate gate
    const gate = GATE_HINTS[gateNumber];
    if (!gate) {
        return {
            success: false,
            message: "that gate doesn't exist. nice try though.",
        };
    }

    // Check cooldown
    const cooldownCheck = canRequestHint(userId, gateNumber);
    if (!cooldownCheck.allowed) {
        return {
            success: false,
            message: cooldownCheck.reason,
            cooldown: cooldownCheck.remaining,
        };
    }

    // Get or initialize hint level
    const key = `${userId}-${gateNumber}`;
    let usage = hintUsage.get(key);

    if (!usage) {
        usage = { level: 0, lastRequest: 0, totalHints: 0 };
    }

    // Increment hint level (max 5)
    usage.level = Math.min(usage.level + 1, 5);
    usage.lastRequest = Date.now();
    usage.totalHints++;
    hintUsage.set(key, usage);

    // Get the hint
    const hint = gate.hints.find(h => h.level === usage.level);
    if (!hint) {
        return {
            success: false,
            message: "you've exhausted all hints for this gate. you're on your own now.",
        };
    }

    // Build response with flavor
    const intro = HINT_INTROS[usage.level][Math.floor(Math.random() * HINT_INTROS[usage.level].length)];
    const outro = HINT_OUTROS[usage.level][Math.floor(Math.random() * HINT_OUTROS[usage.level].length)];

    return {
        success: true,
        gate: gateNumber,
        gateName: gate.name,
        level: usage.level,
        maxLevel: 5,
        intro,
        hint: hint.text,
        hintType: hint.type,
        outro,
        remainingHints: 5 - usage.level,
        message: `${intro}\n\n*${hint.text}*\n\n${outro}`,
    };
}

/**
 * Get hint status for a user
 */
function getHintStatus(userId) {
    const status = {};

    for (let gate = 1; gate <= 7; gate++) {
        const key = `${userId}-${gate}`;
        const usage = hintUsage.get(key);

        status[gate] = {
            gateName: GATE_HINTS[gate].name,
            hintsUsed: usage ? usage.level : 0,
            hintsRemaining: 5 - (usage ? usage.level : 0),
            canRequest: canRequestHint(userId, gate).allowed,
        };
    }

    return status;
}

/**
 * Reset hints for a user (admin function or on gate completion)
 */
function resetHints(userId, gateNumber = null) {
    if (gateNumber) {
        hintUsage.delete(`${userId}-${gateNumber}`);
    } else {
        // Reset all
        for (let gate = 1; gate <= 7; gate++) {
            hintUsage.delete(`${userId}-${gate}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// CONTEXTUAL HINTS - Ika notices when you're struggling
// ═══════════════════════════════════════════════════════════════

const STRUGGLE_RESPONSES = [
    "you've been on this gate for a while... need a `/hint`?",
    "stuck? i could help. if you ask.",
    "i see you struggling. it's okay to ask for guidance.",
    "the gates are meant to challenge, not break you. `/hint` exists.",
    "no shame in asking for help. use `/hint` if you need it.",
];

/**
 * Check if user appears to be struggling and offer help
 * @param {string} userId - Discord user ID
 * @param {number} gateNumber - Current gate
 * @param {number} attempts - Number of failed attempts
 * @returns {string|null} - Offer to help or null
 */
function checkForStruggle(userId, gateNumber, attempts) {
    // Offer help after 3 failed attempts
    if (attempts >= 3 && attempts % 3 === 0) {
        return STRUGGLE_RESPONSES[Math.floor(Math.random() * STRUGGLE_RESPONSES.length)];
    }
    return null;
}

module.exports = {
    requestHint,
    getHintStatus,
    getHintLevel,
    canRequestHint,
    resetHints,
    checkForStruggle,
    GATE_HINTS,
};
