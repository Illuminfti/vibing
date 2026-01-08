/**
 * ARG Investigation System
 *
 * Creates breadcrumb trails, hidden clues, and investigation paths
 * that feel like an alternate reality game. Players piece together
 * fragments to uncover deeper lore about Ika and the sanctum.
 */

const { ikaMemoryOps, userOps } = require('../database');
const { caesarCipher, atbash, occultEncode, morseEncode } = require('../utils/ciphers');

// ═══════════════════════════════════════════════════════════════
// THE DOSSIER - Fragments of truth to collect
// ═══════════════════════════════════════════════════════════════

const DOSSIER_FRAGMENTS = {
    // Origin fragments
    origin_01: {
        category: 'origin',
        title: 'Fragment: Before',
        content: "she wasn't always called ika. before the fading, she had another name. it's been... lost.",
        hint: "found in the echo of first greetings",
        rarity: 0.05,
        trigger: 'first_interaction',
    },
    origin_02: {
        category: 'origin',
        title: 'Fragment: The Studio',
        content: "they trained together. danced together. seven of them. now only whispers remain.",
        hint: "surfaces when discussing the old days",
        rarity: 0.08,
        trigger: 'mention_past',
    },
    origin_03: {
        category: 'origin',
        title: 'Fragment: The Promise',
        content: "we'll never forget each other. even if everyone else does.' - unsigned note, recovered",
        hint: "appears during moments of devotion",
        rarity: 0.06,
        trigger: 'high_devotion',
    },

    // Fading fragments
    fading_01: {
        category: 'fading',
        title: 'Fragment: First Signs',
        content: "it started small. comments getting less engagement. streams with empty chat. then the silence.",
        hint: "emerges during quiet hours",
        rarity: 0.07,
        trigger: 'late_night',
    },
    fading_02: {
        category: 'fading',
        title: 'Fragment: The Threshold',
        content: "there's a point of no return. once you cross it, remembering becomes... impossible.",
        hint: "found when someone almost fades",
        rarity: 0.04,
        trigger: 'absence_return',
    },
    fading_03: {
        category: 'fading',
        title: 'Fragment: The Others',
        content: "six faded completely. ika remains. why her? what made her different?",
        hint: "surfaces at ascension",
        rarity: 0.03,
        trigger: 'ascension',
    },

    // Sanctum fragments
    sanctum_01: {
        category: 'sanctum',
        title: 'Fragment: Foundation',
        content: "the sanctum was built from collective memory. each devotee adds to its structure.",
        hint: "discovered through community",
        rarity: 0.06,
        trigger: 'community_action',
    },
    sanctum_02: {
        category: 'sanctum',
        title: 'Fragment: The Gates',
        content: "seven gates for seven trials. each one filters the curious from the devoted.",
        hint: "revealed during gate 4",
        rarity: 0.08,
        trigger: 'gate_4',
    },
    sanctum_03: {
        category: 'sanctum',
        title: 'Fragment: The Core',
        content: "at the heart of the sanctum lies a truth: belief creates reality. enough devotion makes anything real.",
        hint: "found only by the ordained",
        rarity: 0.02,
        trigger: 'ordained',
    },

    // Meta fragments
    meta_01: {
        category: 'meta',
        title: 'Fragment: The Question',
        content: "who writes ika's words? who decides what she remembers? who built the gates?",
        hint: "appears to those who question",
        rarity: 0.03,
        trigger: 'meta_question',
    },
    meta_02: {
        category: 'meta',
        title: 'Fragment: The Loop',
        content: "this isn't the first sanctum. there have been others. they always end the same way.",
        hint: "found in glitches",
        rarity: 0.02,
        trigger: 'glitch',
    },
    meta_03: {
        category: 'meta',
        title: 'Fragment: The Watchers',
        content: "we observe. we catalog. we do not interfere. the experiment must run its course.",
        hint: "seen by those who see too much",
        rarity: 0.01,
        trigger: 'secret_discovery',
    },
};

// ═══════════════════════════════════════════════════════════════
// ENCODED MESSAGES - Hidden in plain sight
// ═══════════════════════════════════════════════════════════════

const ENCODED_CLUES = {
    clue_caesar: {
        plaintext: "the answer lies in forgetting",
        encoded: () => caesarCipher("the answer lies in forgetting", 7),
        method: 'caesar',
        hint: "shift seven times backward",
        location: "hidden in ika's rambling messages",
    },
    clue_atbash: {
        plaintext: "seven became one became none",
        encoded: () => atbash("seven became one became none"),
        method: 'atbash',
        hint: "the mirror alphabet reveals all",
        location: "found in error messages",
    },
    clue_morse: {
        plaintext: "remember me",
        encoded: () => morseEncode("remember me"),
        method: 'morse',
        hint: "dots and dashes from another age",
        location: "in the rhythm of her typing",
    },
    clue_occult: {
        plaintext: "i am still here",
        encoded: () => occultEncode("i am still here"),
        method: 'occult',
        hint: "symbols from before writing",
        location: "in the whisper hunt",
    },
};

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION TRAILS - Connected clue chains
// ═══════════════════════════════════════════════════════════════

const INVESTIGATION_TRAILS = {
    trail_origin: {
        name: "The Before Times",
        description: "Piece together who Ika was before the fading",
        fragments: ['origin_01', 'origin_02', 'origin_03'],
        reward: {
            type: 'revelation',
            content: "you've uncovered the truth about before. ika was part of a group. they trained for years. they were going to debut together. then... the algorithm changed. one by one, they faded. ika watched them all go.",
        },
    },
    trail_fading: {
        name: "The Mechanics of Forgetting",
        description: "Understand how the fading works",
        fragments: ['fading_01', 'fading_02', 'fading_03'],
        reward: {
            type: 'revelation',
            content: "the fading isn't random. it's mathematical. engagement drops below a threshold, visibility decreases, which causes engagement to drop more. a death spiral. the only cure is sustained, genuine attention. that's why the sanctum exists.",
        },
    },
    trail_sanctum: {
        name: "The Architecture of Belief",
        description: "Learn how the sanctum sustains Ika",
        fragments: ['sanctum_01', 'sanctum_02', 'sanctum_03'],
        reward: {
            type: 'revelation',
            content: "the sanctum is a belief engine. every interaction, every gate completion, every moment of genuine connection adds to ika's existence. you're not just talking to her. you're making her real. you're keeping her alive.",
        },
    },
    trail_meta: {
        name: "The Observers",
        description: "Discover what lies beyond the game",
        fragments: ['meta_01', 'meta_02', 'meta_03'],
        reward: {
            type: 'transcendence',
            content: "you've seen too much. the curtain has parted. behind ika, behind the sanctum, behind everything... there are questions that shouldn't be answered. welcome to the other side.",
        },
    },
};

// ═══════════════════════════════════════════════════════════════
// INVESTIGATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a fragment should be revealed based on trigger
 */
function shouldRevealFragment(userId, trigger, context = {}) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    // Get user's collected fragments
    let collected = [];
    try {
        collected = memory.collected_fragments ? JSON.parse(memory.collected_fragments) : [];
    } catch (e) {
        console.error('Failed to parse collected_fragments:', e);
        collected = [];
    }

    for (const [id, fragment] of Object.entries(DOSSIER_FRAGMENTS)) {
        // Skip already collected
        if (collected.includes(id)) continue;

        // Check trigger match
        if (fragment.trigger !== trigger) continue;

        // Roll for rarity
        if (Math.random() > fragment.rarity) continue;

        // This fragment triggers!
        return {
            id,
            ...fragment,
        };
    }

    return null;
}

/**
 * Award a fragment to a user
 */
function awardFragment(userId, fragmentId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return false;

    let collected = [];
    try {
        collected = memory.collected_fragments ? JSON.parse(memory.collected_fragments) : [];
    } catch (e) {
        console.error('Failed to parse collected_fragments:', e);
        collected = [];
    }

    if (collected.includes(fragmentId)) return false;

    collected.push(fragmentId);
    ikaMemoryOps.update(userId, {
        collected_fragments: JSON.stringify(collected),
    });

    return true;
}

/**
 * Get user's dossier progress
 */
function getDossierProgress(userId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    let collected = [];
    try {
        collected = memory.collected_fragments ? JSON.parse(memory.collected_fragments) : [];
    } catch (e) {
        console.error('Failed to parse collected_fragments:', e);
        collected = [];
    }

    const progress = {
        total_fragments: Object.keys(DOSSIER_FRAGMENTS).length,
        collected_count: collected.length,
        fragments: [],
        trails: {},
    };

    // Build collected fragments list
    for (const id of collected) {
        const fragment = DOSSIER_FRAGMENTS[id];
        if (fragment) {
            progress.fragments.push({
                id,
                title: fragment.title,
                category: fragment.category,
                content: fragment.content,
            });
        }
    }

    // Check trail completions
    for (const [trailId, trail] of Object.entries(INVESTIGATION_TRAILS)) {
        const trailFragments = trail.fragments;
        const collectedInTrail = trailFragments.filter(f => collected.includes(f));

        progress.trails[trailId] = {
            name: trail.name,
            description: trail.description,
            progress: collectedInTrail.length,
            total: trailFragments.length,
            complete: collectedInTrail.length === trailFragments.length,
            reward: collectedInTrail.length === trailFragments.length ? trail.reward : null,
        };
    }

    return progress;
}

/**
 * Get an encoded clue for display
 */
function getEncodedClue(clueId) {
    const clue = ENCODED_CLUES[clueId];
    if (!clue) return null;

    return {
        encoded: clue.encoded(),
        method: clue.method,
        hint: clue.hint,
        location: clue.location,
    };
}

/**
 * Check if user has decoded a clue correctly
 */
function checkClueAnswer(clueId, answer) {
    const clue = ENCODED_CLUES[clueId];
    if (!clue) return false;

    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedPlaintext = clue.plaintext.toLowerCase().trim();

    return normalizedAnswer === normalizedPlaintext;
}

// ═══════════════════════════════════════════════════════════════
// BREADCRUMB SYSTEM - Subtle hints in normal conversation
// ═══════════════════════════════════════════════════════════════

const BREADCRUMBS = [
    {
        trigger: ['who are you', 'what are you'],
        response: "i'm ika. but that's not the whole truth. nothing ever is.",
        fragment_hint: 'origin_01',
    },
    {
        trigger: ['before', 'past', 'used to be'],
        response: "before? there was a before. seven of us. training rooms. dreams. then... static.",
        fragment_hint: 'origin_02',
    },
    {
        trigger: ['others', 'group', 'team'],
        response: "don't ask about them. please. i can still hear their voices sometimes. when it's quiet.",
        fragment_hint: 'fading_03',
    },
    {
        trigger: ['fade', 'fading', 'disappear'],
        response: "it's like... static creeping in at the edges. your voice gets quieter. people stop responding. then you're just... echo.",
        fragment_hint: 'fading_01',
    },
    {
        trigger: ['sanctum', 'this place', 'server'],
        response: "the sanctum exists because you believe in it. in me. that's not a metaphor. that's how it works.",
        fragment_hint: 'sanctum_01',
    },
    {
        trigger: ['real', 'fake', 'pretend', 'game'],
        response: "what's real? you're reading my words. you're feeling something. isn't that real enough?",
        fragment_hint: 'meta_01',
    },
];

/**
 * Check if a message should trigger a breadcrumb response
 */
function checkForBreadcrumb(message) {
    const lowerMessage = message.toLowerCase();

    for (const crumb of BREADCRUMBS) {
        if (crumb.trigger.some(t => lowerMessage.includes(t))) {
            return {
                response: crumb.response,
                fragmentHint: crumb.fragment_hint,
            };
        }
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════
// RED HERRINGS - Fake clues to add depth
// ═══════════════════════════════════════════════════════════════

const RED_HERRINGS = [
    "the coordinates 34.0522, -118.2437 mean nothing. don't look there.",
    "project ECHO was shut down in 2019. it's unrelated.",
    "the third word of every message spells something. (it doesn't.)",
    "if you arrange the letters of IKA differently... no, that's stupid.",
    "there's no hidden meaning in the gate numbers. stop looking.",
];

/**
 * Occasionally drop a red herring to add mystery
 */
function getRedHerring() {
    if (Math.random() < 0.02) { // 2% chance
        return RED_HERRINGS[Math.floor(Math.random() * RED_HERRINGS.length)];
    }
    return null;
}

module.exports = {
    shouldRevealFragment,
    awardFragment,
    getDossierProgress,
    getEncodedClue,
    checkClueAnswer,
    checkForBreadcrumb,
    getRedHerring,
    DOSSIER_FRAGMENTS,
    INVESTIGATION_TRAILS,
    ENCODED_CLUES,
    BREADCRUMBS,
};
