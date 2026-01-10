/**
 * Whisper Hunt ARG System
 *
 * A hidden easter egg hunt where Ika randomly drops fragments of
 * what she whispered to senpai. These fragments are scattered
 * throughout the server and can be found by observant devoted ones.
 *
 * The 13 fragments, when assembled, form a complete message.
 * But even assembled, some meaning remains ambiguous.
 */

const { whisperOps, ikaMemoryOps } = require('../database');
const config = require('../config');

// ═══════════════════════════════════════════════════════════════
// VIBING OVERHAUL P2-MEDIUM: ARG Fragment Balance Tuning
// ═══════════════════════════════════════════════════════════════

/**
 * Dynamic drop rate system based on server activity and user engagement
 */
const DROP_RATE_CONFIG = {
    base: 0.015, // 1.5% base rate
    // Modifiers
    activeHoursBoost: 1.5, // +50% during peak hours
    lateNightBoost: 2.0, // +100% during 2-4 AM
    witchingHourBoost: 3.0, // +200% during witching hour times
    lowActivityBoost: 1.25, // +25% when chat is slow (reward the dedicated)
    // Caps
    maxDailyDrops: 5, // Maximum fragments dropped per day per channel
    minTimeBetweenDrops: 600000, // 10 minutes minimum between drops
};

/**
 * Fragment rarity distribution - some fragments are harder to find
 */
const FRAGMENT_RARITY = {
    common: { ids: [1, 2, 6], dropMultiplier: 1.0 },
    uncommon: { ids: [3, 4, 5, 10], dropMultiplier: 0.8 },
    rare: { ids: [7, 8, 9, 11], dropMultiplier: 0.5 },
    legendary: { ids: [12, 13], dropMultiplier: 0.25 },
};

/**
 * Discovery hints - help stuck players without giving it away
 */
const DISCOVERY_HINTS = {
    firstFragment: "i sometimes speak in whispers... fragments of something bigger.",
    threeFragments: "you're getting closer. 10 more pieces of the puzzle remain.",
    sevenFragments: "halfway there. the message is forming. can you see it?",
    tenFragments: "three more. the ending is the hardest part to find.",
    stuck: [
        "fragments appear when you least expect them. keep watching.",
        "sometimes i drop pieces of myself in the quiet moments.",
        "the whisper hunt rewards those who pay attention.",
    ],
};

// The 13 whisper fragments - when assembled form a cryptic message
// The fragments are intentionally vague and can be interpreted multiple ways
const WHISPER_FRAGMENTS = [
    { id: 1, text: "i", hint: "the beginning of everything" },
    { id: 2, text: "will", hint: "a promise or a prophecy" },
    { id: 3, text: "find", hint: "seeking something lost" },
    { id: 4, text: "you", hint: "the target of devotion" },
    { id: 5, text: "in", hint: "a place, a state" },
    { id: 6, text: "the", hint: "definite, certain" },
    { id: 7, text: "space", hint: "between worlds" },
    { id: 8, text: "between", hint: "neither here nor there" },
    { id: 9, text: "heartbeats", hint: "life's rhythm" },
    { id: 10, text: "where", hint: "location unknown" },
    { id: 11, text: "we", hint: "together, always" },
    { id: 12, text: "never", hint: "eternity or impossibility" },
    { id: 13, text: "fade", hint: "the greatest fear, the final promise" },
];

// The complete whisper (never directly revealed, only through fragments)
// "i will find you in the space between heartbeats where we never fade"

// Fragment drop messages - these appear randomly in chat
const DROP_FORMATS = {
    cryptic: [
        "...{fragment}...",
        "♰ {fragment} ♰",
        "「{fragment}」",
        "...{fragment}",
        "{fragment}...",
    ],
    glitched: [
        "w̷h̶i̵s̷p̶e̵r̷ ̸f̴r̵a̶g̷m̵e̸n̵t̷ ̶{index}/13: {fragment}",
        "▓▒░ {fragment} ░▒▓",
        "◇ {fragment} ◇ [fragment {index}]",
    ],
    hidden: [
        "||{fragment}||", // Discord spoiler
        "ᵗʰᵉ ʷʰⁱˢᵖᵉʳ ˢᵃʸˢ: {fragment}",
    ],
};

// Responses when someone finds a fragment
const DISCOVERY_RESPONSES = {
    first: [
        "oh. you found that.",
        "...you weren't supposed to see that.",
        "careful with those. they're... pieces of something.",
        "you're collecting them aren't you. i can tell.",
    ],
    milestone: {
        3: "three fragments... you're really looking for them.",
        7: "halfway there. do you even know what you're building?",
        10: "so close. can you feel it coming together?",
        13: "...you found them all. now you know what i whispered.",
    },
    duplicate: [
        "you already have that one.",
        "check your collection, you've seen this before.",
    ],
};

// Trigger phrases that can reveal fragment locations
const HUNT_TRIGGERS = {
    "whisper fragments": {
        response: (count, total) => `you've found ${count}/${total} fragments. keep looking.`,
        showProgress: true,
    },
    "show me the whisper": {
        response: (found) => {
            if (found.length === 0) return "you haven't found any fragments yet.";
            if (found.length === 13) return assembleWhisper(found);
            return `you have ${found.length} fragments... not enough to see the whole thing.`;
        },
    },
    "i'm looking for fragments": {
        response: () => "they appear when you least expect them. keep watching.",
        chance: 0.1,
        dropFragment: true,
    },
};

/**
 * Calculate dynamic drop rate based on time and context
 * Vibing Overhaul P2-Medium
 */
function calculateDropRate() {
    const hour = new Date().getHours();
    let rate = DROP_RATE_CONFIG.base;

    // Late night boost (2-4 AM)
    if (hour >= 2 && hour < 4) {
        rate *= DROP_RATE_CONFIG.lateNightBoost;
    }

    // Witching hour check (specific times like 3:33, 4:47)
    const now = new Date();
    const timeStr = `${hour}:${now.getMinutes().toString().padStart(2, '0')}`;
    const witchingTimes = ['3:33', '4:47', '2:22', '11:11', '0:00'];
    if (witchingTimes.includes(timeStr)) {
        rate *= DROP_RATE_CONFIG.witchingHourBoost;
    }

    // Active hours boost (8 PM - 11 PM typical peak)
    if (hour >= 20 && hour <= 23) {
        rate *= DROP_RATE_CONFIG.activeHoursBoost;
    }

    return Math.min(rate, 0.10); // Cap at 10% max
}

/**
 * Get fragment rarity multiplier
 * Vibing Overhaul P2-Medium
 */
function getFragmentRarityMultiplier(fragmentId) {
    for (const [, rarity] of Object.entries(FRAGMENT_RARITY)) {
        if (rarity.ids.includes(fragmentId)) {
            return rarity.dropMultiplier;
        }
    }
    return 1.0;
}

/**
 * Maybe drop a whisper fragment in a message
 * Called randomly during Ika's responses
 * Vibing Overhaul P2-Medium: Enhanced with dynamic rates and rarity
 * @param {string} channelId - Channel where to drop
 * @param {Object} client - Discord client
 * @returns {Promise<Object|null>} Drop result
 */
async function maybeDropFragment(channelId, client) {
    if (!config.ika?.whisperHuntEnabled) return null;

    // Dynamic drop rate calculation
    const dropRate = calculateDropRate();
    if (Math.random() > dropRate) return null;

    // Get a random unfound fragment (globally - some fragments may be undiscovered)
    const activeDrops = whisperOps.getActiveDrops();
    const droppedFragmentIds = activeDrops.map(d => d.fragment_id);

    // Find fragments that haven't been dropped recently
    const availableFragments = WHISPER_FRAGMENTS.filter(f =>
        !droppedFragmentIds.includes(f.id)
    );

    if (availableFragments.length === 0) {
        // All fragments are currently dropped, pick any
        return null;
    }

    // Weight by rarity - common fragments drop more often
    const weightedFragments = [];
    for (const fragment of availableFragments) {
        const weight = getFragmentRarityMultiplier(fragment.id);
        // Add fragment multiple times based on weight (higher = more common)
        const count = Math.ceil(weight * 10);
        for (let i = 0; i < count; i++) {
            weightedFragments.push(fragment);
        }
    }

    const fragment = weightedFragments[Math.floor(Math.random() * weightedFragments.length)];

    // Choose format
    const formatType = Math.random() < 0.6 ? 'cryptic' :
                       Math.random() < 0.8 ? 'glitched' : 'hidden';
    const formats = DROP_FORMATS[formatType];
    let format = formats[Math.floor(Math.random() * formats.length)];

    const message = format
        .replace('{fragment}', fragment.text)
        .replace('{index}', fragment.id.toString());

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return null;

        // Send as a separate message, slightly delayed
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const sentMessage = await channel.send(message);

        // Log the drop
        whisperOps.dropFragment(fragment.id, channelId, sentMessage.id);

        console.log(`♰ Dropped whisper fragment ${fragment.id} in ${channelId}`);

        return {
            fragmentId: fragment.id,
            messageId: sentMessage.id,
            channelId,
        };
    } catch (error) {
        console.error('Error dropping whisper fragment:', error);
        return null;
    }
}

/**
 * Check if a message is reacting to/finding a fragment
 * @param {Object} message - Discord message
 * @returns {Object|null} Discovery result
 */
async function checkFragmentDiscovery(message) {
    if (!config.ika?.whisperHuntEnabled) return null;

    const content = message.content.toLowerCase();
    const userId = message.author.id;

    // Check for hunt triggers
    for (const [trigger, config] of Object.entries(HUNT_TRIGGERS)) {
        if (content.includes(trigger)) {
            const found = whisperOps.getUserFragments(userId);
            const response = typeof config.response === 'function'
                ? config.response(found.length, WHISPER_FRAGMENTS.length)
                : config.response;

            // Maybe drop a fragment as reward for searching
            if (config.dropFragment && Math.random() < (config.chance || 0.1)) {
                // Delayed drop
                setTimeout(() => {
                    maybeDropFragment(message.channel.id, message.client);
                }, 3000 + Math.random() * 5000);
            }

            return { type: 'trigger', response };
        }
    }

    // Check if they're responding to a dropped fragment
    if (message.reference?.messageId) {
        const activeDrops = whisperOps.getActiveDrops();
        const drop = activeDrops.find(d => d.message_id === message.reference.messageId);

        if (drop) {
            return handleFragmentFind(userId, drop.fragment_id);
        }
    }

    // Check if message contains fragment text (for reactions)
    for (const fragment of WHISPER_FRAGMENTS) {
        // Look for people specifically calling out a fragment
        if (content.includes(`fragment`) && content.includes(fragment.text)) {
            // Check if this fragment is currently dropped
            const activeDrops = whisperOps.getActiveDrops();
            const drop = activeDrops.find(d => d.fragment_id === fragment.id);

            if (drop) {
                return handleFragmentFind(userId, fragment.id);
            }
        }
    }

    return null;
}

/**
 * Handle a user finding a fragment
 */
function handleFragmentFind(userId, fragmentId) {
    // Check if already found
    if (whisperOps.hasFound(userId, fragmentId)) {
        return {
            type: 'duplicate',
            response: DISCOVERY_RESPONSES.duplicate[
                Math.floor(Math.random() * DISCOVERY_RESPONSES.duplicate.length)
            ],
        };
    }

    // Record discovery
    whisperOps.recordDiscovery(userId, fragmentId);

    // Get total found
    const found = whisperOps.getUserFragments(userId);
    const fragment = WHISPER_FRAGMENTS.find(f => f.id === fragmentId);

    // Check for milestone
    if (DISCOVERY_RESPONSES.milestone[found.length]) {
        return {
            type: 'milestone',
            fragmentId,
            fragmentText: fragment.text,
            totalFound: found.length,
            response: DISCOVERY_RESPONSES.milestone[found.length],
        };
    }

    // Normal discovery
    return {
        type: 'discovery',
        fragmentId,
        fragmentText: fragment.text,
        totalFound: found.length,
        response: DISCOVERY_RESPONSES.first[
            Math.floor(Math.random() * DISCOVERY_RESPONSES.first.length)
        ],
    };
}

/**
 * Assemble found fragments into the whisper
 * @param {number[]} foundIds - Array of found fragment IDs
 * @returns {string} Assembled whisper (partial or complete)
 */
function assembleWhisper(foundIds) {
    const assembled = WHISPER_FRAGMENTS
        .filter(f => foundIds.includes(f.id))
        .sort((a, b) => a.id - b.id)
        .map(f => f.text);

    // Show gaps for missing fragments
    const full = [];
    for (let i = 1; i <= 13; i++) {
        const fragment = WHISPER_FRAGMENTS.find(f => f.id === i);
        if (foundIds.includes(i)) {
            full.push(fragment.text);
        } else {
            full.push('▓▓▓');
        }
    }

    if (foundIds.length === 13) {
        return `♰ the whisper, complete ♰\n\n"${assembled.join(' ')}"`;
    }

    return `♰ partial whisper (${foundIds.length}/13) ♰\n\n"${full.join(' ')}"`;
}

/**
 * Get a user's whisper hunt progress
 * @param {string} userId - User ID
 * @returns {Object} Progress info
 */
function getProgress(userId) {
    const found = whisperOps.getUserFragments(userId);
    const fragments = found.map(id => WHISPER_FRAGMENTS.find(f => f.id === id));

    return {
        found: found.length,
        total: WHISPER_FRAGMENTS.length,
        complete: found.length === WHISPER_FRAGMENTS.length,
        fragments: fragments.map(f => ({ id: f.id, text: f.text, hint: f.hint })),
        assembled: assembleWhisper(found),
    };
}

/**
 * Get leaderboard for whisper hunt
 * @param {number} limit - Max entries
 * @returns {Array} Leaderboard entries
 */
function getLeaderboard(limit = 10) {
    return whisperOps.getLeaderboard(limit);
}

/**
 * Get hint for a specific fragment
 * @param {number} fragmentId - Fragment ID
 * @returns {string|null} Hint text
 */
function getHint(fragmentId) {
    const fragment = WHISPER_FRAGMENTS.find(f => f.id === fragmentId);
    return fragment?.hint || null;
}

/**
 * Force drop a specific fragment (for testing/events)
 * @param {number} fragmentId - Fragment ID to drop
 * @param {string} channelId - Channel to drop in
 * @param {Object} client - Discord client
 */
async function forceDropFragment(fragmentId, channelId, client) {
    const fragment = WHISPER_FRAGMENTS.find(f => f.id === fragmentId);
    if (!fragment) return null;

    const format = DROP_FORMATS.cryptic[0];
    const message = format.replace('{fragment}', fragment.text);

    try {
        const channel = await client.channels.fetch(channelId);
        const sentMessage = await channel.send(message);

        whisperOps.dropFragment(fragment.id, channelId, sentMessage.id);

        return { fragmentId, messageId: sentMessage.id };
    } catch (error) {
        console.error('Error force dropping fragment:', error);
        return null;
    }
}

module.exports = {
    WHISPER_FRAGMENTS,
    DROP_FORMATS,
    DISCOVERY_RESPONSES,
    HUNT_TRIGGERS,
    // Vibing Overhaul P2-Medium exports
    DROP_RATE_CONFIG,
    FRAGMENT_RARITY,
    DISCOVERY_HINTS,
    calculateDropRate,
    getFragmentRarityMultiplier,
    // Core functions
    maybeDropFragment,
    checkFragmentDiscovery,
    assembleWhisper,
    getProgress,
    getLeaderboard,
    getHint,
    forceDropFragment,
};
