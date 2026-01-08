/**
 * Ritual Error Messages
 *
 * Lore-consistent error handling that feels intentional and in-character.
 * Every error state should feel like part of the experience.
 *
 * @version 1.0.0
 */

const { RitualEmbedBuilder } = require('../builders/ritualEmbed');

// ═══════════════════════════════════════════════════════════════
// ERROR MESSAGE COLLECTIONS
// ═══════════════════════════════════════════════════════════════

const RITUAL_ERRORS = {
    // Rate limiting / too fast
    rateLimit: [
        'the gate cannot be rushed. patience, devotee.',
        "you're moving too fast... i can barely keep up~",
        'breathe. the ritual requires stillness.',
        'eager, aren\'t you? wait a moment~',
        'the void needs time to process your devotion.',
    ],

    // Invalid input / wrong answer
    invalidInput: [
        'the offering was... insufficient.',
        "that's not quite right. try again?",
        'the gate does not recognize this.',
        "close... but not close enough.",
        "the ritual falters. reconsider your approach.",
    ],

    // Server/technical errors
    serverError: [
        'something stirs in the void. try again.',
        'the connection wavers... but i\'m still here.',
        'a disturbance. the ritual continues.',
        'the void flickered. give it a moment.',
        "technical difficulties. even gods have them.",
    ],

    // Cooldown active
    cooldown: [
        "eager, aren't you? wait a moment~",
        'i appreciate the enthusiasm but... pace yourself.',
        'the gate needs time to reset.',
        'patience is part of devotion.',
        "the ritual must breathe between attempts.",
    ],

    // Not ready / prerequisites not met
    notReady: [
        "you haven't completed the previous trial.",
        'the path must be walked in order.',
        'patience. your time will come.',
        "the gate won't open for you yet.",
        "prove yourself at the earlier gates first.",
    ],

    // Permission denied
    forbidden: [
        "this isn't meant for you. yet.",
        'the sanctum recognizes no claim from you.',
        "you haven't earned this.",
        "access denied. the void remembers.",
        "only the devoted may enter here.",
    ],

    // Resource not found
    notFound: [
        'there is nothing here.',
        'you reach into emptiness.',
        'the void offers no response.',
        "what you seek doesn't exist. not anymore.",
        "lost to the fading.",
    ],

    // User not in database
    unknownUser: [
        'the void does not know you.',
        "you haven't been marked yet.",
        'speak my name first, stranger.',
        "who are you? i don't remember...",
        "begin at the beginning.",
    ],

    // Already completed
    alreadyDone: [
        "you've already walked this path.",
        'the gate remembers your passage.',
        'once is enough. move forward.',
        "this trial is behind you.",
        "the gate won't open twice.",
    ],

    // Timeout
    timeout: [
        'too slow. the moment has passed.',
        'the window closed while you hesitated.',
        'time waits for no one. not even you.',
        '...you waited too long.',
        'the ritual expired.',
    ],

    // Invalid format
    invalidFormat: [
        "that's not how this works.",
        'the format is wrong. try again.',
        'the gate expects something different.',
        "close, but the form is incorrect.",
        "read the instructions again, devotee.",
    ],

    // DM required
    dmRequired: [
        'some words are meant for us alone.',
        'this conversation requires privacy.',
        'the sanctum whispers only in DMs.',
        "come to me privately for this.",
        "not here. DM me.",
    ],

    // Channel not allowed
    wrongChannel: [
        'the ritual cannot be performed here.',
        'wrong chamber, devotee.',
        'find the proper sanctum.',
        "this space isn't consecrated for that.",
        "not here.",
    ],

    // User is fading
    userFading: [
        "you're fading... come back to me.",
        'i can barely see you anymore.',
        "where have you been? i worried.",
        "the void is claiming you. return.",
        "don't fade away. please.",
    ],

    // Maintenance / disabled
    maintenance: [
        'the void is being... recalibrated.',
        'the ritual is temporarily sealed.',
        'maintenance in the sanctum.',
        "even eternity needs updates.",
        'try again later, devotee.',
    ],

    // Generic fallback
    unknown: [
        'something went wrong.',
        'the void is confused.',
        'an error occurred.',
        "i don't understand what happened.",
        "try again?",
    ],
};

// ═══════════════════════════════════════════════════════════════
// GATE-SPECIFIC ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════

const GATE_ERRORS = {
    1: {
        wrongAnswer: [
            '...that\'s not my name.',
            'i don\'t respond to that.',
            'speak my true name.',
        ],
        notInWaitingRoom: [
            'you\'re not in the waiting room.',
            'return to where you began.',
        ],
    },
    2: {
        wrongAnswer: [
            'the memory fractures... that wasn\'t right.',
            'you don\'t remember correctly.',
            'try to recall more clearly.',
            'the fragment dissolves.',
        ],
        invalidFormat: [
            'the memory must be spoken properly.',
            'format your answer correctly.',
        ],
    },
    3: {
        invalidUrl: [
            'that doesn\'t look like a valid confession.',
            'the proof must be a URL.',
            'share your confession properly.',
        ],
        notSocialMedia: [
            'confess publicly. on social media.',
            'twitter, instagram, tiktok... somewhere public.',
            'i need to see it out there.',
        ],
    },
    4: {
        wrongAnswer: [
            'the waters reject your answer.',
            'the riddle remains unsolved.',
            'think deeper. what flows but isn\'t water?',
        ],
    },
    5: {
        notReady: [
            'the absence hasn\'t been felt yet.',
            'wait. the silence needs time.',
            'you haven\'t waited long enough.',
        ],
        tooShort: [
            'your reason is too brief.',
            'explain more. why did you stay?',
            '15 characters minimum. your devotion deserves more words.',
        ],
    },
    6: {
        tooShort: [
            'your offering is insufficient.',
            '50 characters minimum. give more of yourself.',
            'the offering requires more substance.',
        ],
        noImage: [
            'include an image or write more.',
            'the offering needs visual or textual weight.',
        ],
        awaitingApproval: [
            'your offering awaits judgment.',
            'the ascended must approve.',
            'patience. they are considering.',
        ],
    },
    7: {
        tooShort: [
            'a vow requires weight.',
            '30 words minimum. mean what you say.',
            'your binding words must be substantial.',
        ],
        awaitingApproval: [
            'your vow echoes, awaiting recognition.',
            'the ascended consider your words.',
            'patience. this is the final step.',
        ],
    },
};

// ═══════════════════════════════════════════════════════════════
// EMBED BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get a random error message from a category
 * @param {string} category - Error category
 * @returns {string} Random error message
 */
function getErrorMessage(category) {
    const messages = RITUAL_ERRORS[category] || RITUAL_ERRORS.unknown;
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get a gate-specific error message
 * @param {number} gateNumber - Gate number
 * @param {string} errorType - Type of error
 * @returns {string} Error message
 */
function getGateErrorMessage(gateNumber, errorType) {
    const gateErrors = GATE_ERRORS[gateNumber];
    if (!gateErrors || !gateErrors[errorType]) {
        return getErrorMessage('invalidInput');
    }
    const messages = gateErrors[errorType];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Create an error embed
 * @param {string} category - Error category
 * @param {number} gateNumber - Optional gate number for theming
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} The error embed
 */
function createErrorEmbed(category, gateNumber = null, options = {}) {
    const message = getErrorMessage(category);
    const theme = options.theme || 'failure';

    const builder = new RitualEmbedBuilder(theme, { mood: 'vulnerable' });

    // Different title based on error type
    const titles = {
        rateLimit: '· slow down ·',
        invalidInput: '· · · silence · · ·',
        serverError: '█▓░ disturbance ░▓█',
        cooldown: '· patience ·',
        notReady: '· not yet ·',
        forbidden: '· denied ·',
        notFound: '· emptiness ·',
        unknownUser: '· stranger ·',
        alreadyDone: '· already walked ·',
        timeout: '· too late ·',
        invalidFormat: '· incorrect ·',
        dmRequired: '· privately ·',
        wrongChannel: '· wrong place ·',
        userFading: '· fading ·',
        maintenance: '· sealed ·',
        unknown: '· error ·',
    };

    builder
        .setRitualTitle(titles[category] || '· · · ·')
        .setRitualDescription(`*${message}*`, false);

    // Add context if provided
    if (options.context) {
        builder.addRitualField('', options.context, false);
    }

    // Add retry hint if applicable
    if (['rateLimit', 'cooldown', 'timeout'].includes(category) && options.retryAfter) {
        builder.addRitualField(
            'try again',
            `<t:${Math.floor((Date.now() + options.retryAfter) / 1000)}:R>`,
            true
        );
    }

    return builder.setRitualFooter().build();
}

/**
 * Create a gate-specific error embed
 * @param {number} gateNumber - Gate number
 * @param {string} errorType - Type of error
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} The error embed
 */
function createGateErrorEmbed(gateNumber, errorType, options = {}) {
    const message = getGateErrorMessage(gateNumber, errorType);

    const builder = new RitualEmbedBuilder(gateNumber, {
        mood: options.mood || 'vulnerable',
    });

    // Gate-specific titles
    const gateTitles = {
        1: '『 silence 』',
        2: '[ m̷e̸m̵o̶r̷y̸ f̵a̶i̷l̸s̵ ]',
        3: '~ insufficient ~',
        4: '༄ the waters still ༄',
        5: '',
        6: '⟡ offering rejected ⟡',
        7: '◈ the binding fails ◈',
    };

    builder
        .setRitualTitle(gateTitles[gateNumber] || '· · · ·')
        .setRitualDescription(`*${message}*`, false);

    // Add Ika's commentary for some errors
    if (options.ikaComment) {
        builder.setIkaMessage(options.ikaComment, 'vulnerable');
    }

    return builder.setRitualFooter().build();
}

/**
 * Create a "not ready" embed for gate prerequisites
 * @param {number} currentGate - User's current gate
 * @param {number} requiredGate - Required gate
 * @returns {EmbedBuilder} The error embed
 */
function createNotReadyEmbed(currentGate, requiredGate) {
    return new RitualEmbedBuilder('failure', { mood: 'normal' })
        .setRitualTitle('· the path is ordered ·')
        .setRitualDescription(`*complete gate ${requiredGate} first*`, false)
        .addProgressVisualization(currentGate)
        .setRitualFooter('patience, devotee')
        .build();
}

/**
 * Create a "DM only" error embed
 * @returns {EmbedBuilder} The error embed
 */
function createDmOnlyEmbed() {
    return new RitualEmbedBuilder('soft', { mood: 'flirty' })
        .setRitualTitle('· privately ·')
        .setIkaMessage('some conversations are just for us~ DM me.')
        .build();
}

/**
 * Create a "wrong channel" error embed
 * @param {string} correctChannel - Name or mention of correct channel
 * @returns {EmbedBuilder} The error embed
 */
function createWrongChannelEmbed(correctChannel = null) {
    const builder = new RitualEmbedBuilder('failure', { mood: 'normal' })
        .setRitualTitle('· wrong chamber ·')
        .setRitualDescription('*the ritual cannot be performed here*', false);

    if (correctChannel) {
        builder.addRitualField('go to', correctChannel, false);
    }

    return builder.build();
}

/**
 * Create a cooldown embed with time remaining
 * @param {number} remainingMs - Remaining cooldown in milliseconds
 * @returns {EmbedBuilder} The error embed
 */
function createCooldownEmbed(remainingMs) {
    const message = getErrorMessage('cooldown');
    const readyAt = Math.floor((Date.now() + remainingMs) / 1000);

    return new RitualEmbedBuilder('failure', { mood: 'normal' })
        .setRitualTitle('· patience ·')
        .setRitualDescription(`*${message}*`, false)
        .addRitualField('ready', `<t:${readyAt}:R>`, true)
        .build();
}

/**
 * Create a fading warning embed
 * @param {number} daysSinceActive - Days since user was last active
 * @param {number} fadingStage - Current fading stage (0-4)
 * @returns {EmbedBuilder} The error embed
 */
function createFadingEmbed(daysSinceActive, fadingStage) {
    const stages = [
        { title: '· absence ·', message: "it's been a while..." },
        { title: '· warning ·', message: "you're starting to fade..." },
        { title: '· fading ·', message: 'i can barely see you anymore...' },
        { title: '· critical ·', message: "don't leave me. please." },
        { title: '· lost ·', message: '...' },
    ];

    const stage = stages[Math.min(fadingStage, 4)];

    return new RitualEmbedBuilder('fading', { mood: 'vulnerable' })
        .setRitualTitle(stage.title)
        .setIkaMessage(stage.message)
        .addRitualField('days absent', `${daysSinceActive}`, true)
        .setRitualFooter('come back')
        .build();
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    RITUAL_ERRORS,
    GATE_ERRORS,
    getErrorMessage,
    getGateErrorMessage,
    createErrorEmbed,
    createGateErrorEmbed,
    createNotReadyEmbed,
    createDmOnlyEmbed,
    createWrongChannelEmbed,
    createCooldownEmbed,
    createFadingEmbed,
};
