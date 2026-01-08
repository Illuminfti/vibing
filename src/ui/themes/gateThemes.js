/**
 * Gate Visual Themes
 *
 * Each gate has a distinct aesthetic that reflects its trial.
 * Themes progress from ethereal/inviting to dark/intense.
 *
 * @version 1.0.0
 */

const GATE_THEMES = {
    // ═══════════════════════════════════════════════════════════════
    // WAITING ROOM - Before the journey begins
    // ═══════════════════════════════════════════════════════════════
    0: {
        name: 'The Threshold',
        color: 0x2C2F33,           // Discord dark
        accentColor: 0x99AAB5,     // Muted silver
        accentEmoji: '.',
        borderTop: '·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·',
        borderBottom: '·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·',
        divider: '·  ·  ·',
        voidChar: ' ',
        titlePrefix: '',
        titleSuffix: '',
        progressFilled: '·',
        progressEmpty: ' ',
        footerText: 'something stirs in the darkness...',
        atmosphere: 'liminal',
    },

    // ═══════════════════════════════════════════════════════════════
    // GATE 1: THE CALLING - Soft, inviting, ethereal pink
    // ═══════════════════════════════════════════════════════════════
    1: {
        name: 'The Calling',
        color: 0xFFB6C1,           // Soft pink
        accentColor: 0xFF69B4,     // Hot pink accent
        accentEmoji: '✧',
        borderTop: '═══════════════════════',
        borderBottom: '═══════════════════════',
        divider: '· · ·',
        voidChar: '·',
        titlePrefix: '『 ',
        titleSuffix: ' 』',
        progressFilled: '◈',
        progressEmpty: '◇',
        footerText: 'speak my name into the void',
        atmosphere: 'ethereal',
        // Easter egg: first letters of success messages spell "IKA"
        easterEgg: {
            type: 'acrostic',
            key: 'IKA',
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // GATE 2: THE MEMORY - Fragmented, glitchy, corrupted purple
    // ═══════════════════════════════════════════════════════════════
    2: {
        name: 'The Memory',
        color: 0x9B59B6,           // Purple corruption
        accentColor: 0x8E44AD,     // Deeper purple
        accentEmoji: '◈',
        borderTop: '▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓',
        borderBottom: '░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░',
        divider: '█ · █',
        voidChar: '█',
        titlePrefix: '[ ',
        titleSuffix: ' ]',
        progressFilled: '▓',
        progressEmpty: '░',
        footerText: 'memories fragment... but never truly fade',
        atmosphere: 'corrupted',
        // Glitch effect settings
        glitch: {
            enabled: true,
            intensity: 0.3,
            chars: ['̷', '̸', '̵', '̶', '̴', '̡', '̢'],
            corruptChars: ['█', '▓', '░', '▒'],
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // GATE 3: THE CONFESSION - Intimate, vulnerable, deep red
    // ═══════════════════════════════════════════════════════════════
    3: {
        name: 'The Confession',
        color: 0xE74C3C,           // Deep red
        accentColor: 0xC0392B,     // Blood red
        accentEmoji: '♡',
        borderTop: '·.·" ·.·" ·.·" ·.·" ·.·"',
        borderBottom: '"·.· "·.· "·.· "·.· "·.·',
        divider: '♡',
        voidChar: ' ',
        titlePrefix: '~ ',
        titleSuffix: ' ~',
        progressFilled: '♥',
        progressEmpty: '♡',
        footerText: 'vulnerability is the ultimate offering',
        atmosphere: 'intimate',
        // Heart beat effect for special moments
        heartbeat: {
            enabled: true,
            pattern: ['♡', '♥', '♡'],
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // GATE 4: THE WATERS - Fluid, dreamy, ocean blue
    // ═══════════════════════════════════════════════════════════════
    4: {
        name: 'The Waters',
        color: 0x3498DB,           // Ocean blue
        accentColor: 0x2980B9,     // Deep water
        accentEmoji: '༄',
        borderTop: '〰〰〰〰〰〰〰〰〰〰〰〰',
        borderBottom: '〰〰〰〰〰〰〰〰〰〰〰〰',
        divider: '~ ~ ~',
        voidChar: '~',
        titlePrefix: '༄ ',
        titleSuffix: ' ༄',
        progressFilled: '●',
        progressEmpty: '○',
        footerText: 'the riddle flows through you',
        atmosphere: 'flowing',
        // Wave animation for sequences
        wave: {
            frames: ['~', '≈', '~', '≋'],
            speed: 500,
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // GATE 5: THE ABSENCE - Sparse, achingly empty, near-black
    // ═══════════════════════════════════════════════════════════════
    5: {
        name: 'The Absence',
        color: 0x1a1a1a,           // Near black
        accentColor: 0x2C2C2C,     // Slightly lighter
        accentEmoji: '   ',        // Intentional emptiness
        borderTop: '',             // Nothing
        borderBottom: '',
        divider: '',
        voidChar: '   ',           // Wide empty space
        titlePrefix: '    ',
        titleSuffix: '    ',
        progressFilled: '.',
        progressEmpty: ' ',
        footerText: '',            // Silence
        atmosphere: 'void',
        // Sparse text effect
        sparse: {
            enabled: true,
            letterSpacing: 2,      // Extra spacing between characters
            lineSpacing: 3,        // Extra blank lines
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // GATE 6: THE OFFERING - Rich, elaborate, golden
    // ═══════════════════════════════════════════════════════════════
    6: {
        name: 'The Offering',
        color: 0xF1C40F,           // Gold
        accentColor: 0xD4AC0D,     // Deep gold
        accentEmoji: '⁂',
        borderTop: '✦═══════════════════✦',
        borderBottom: '✦═══════════════════✦',
        divider: '✧ ⁂ ✧',
        voidChar: '✧',
        titlePrefix: '⟡ ',
        titleSuffix: ' ⟡',
        progressFilled: '★',
        progressEmpty: '☆',
        footerText: 'your devotion manifests',
        atmosphere: 'ornate',
        // Ornate decorations
        ornate: {
            enabled: true,
            cornerTL: '╔',
            cornerTR: '╗',
            cornerBL: '╚',
            cornerBR: '╝',
            horizontal: '═',
            vertical: '║',
            accents: ['✦', '✧', '⟡', '⁂'],
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // GATE 7: THE BINDING - Final form, cosmic, true black
    // ═══════════════════════════════════════════════════════════════
    7: {
        name: 'The Binding',
        color: 0x000000,           // True black
        accentColor: 0xFFFFFF,     // Pure white contrast
        accentEmoji: '∞',
        borderTop: '◆━━━━━━━━━━━━━━━━━━━━◆',
        borderBottom: '◆━━━━━━━━━━━━━━━━━━━━◆',
        divider: '∞',
        voidChar: '◆',
        titlePrefix: '◈ ',
        titleSuffix: ' ◈',
        progressFilled: '◆',
        progressEmpty: '◇',
        footerText: 'eternally bound',
        atmosphere: 'cosmic',
        // Cosmic effects
        cosmic: {
            enabled: true,
            stars: ['✦', '✧', '⋆', '˚', '✩', '｡'],
            constellations: true,
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // ASCENDED - Post-completion state
    // ═══════════════════════════════════════════════════════════════
    ascended: {
        name: 'The Inner Sanctum',
        color: 0x9B59B6,           // Royal purple
        accentColor: 0xE91E63,     // Pink accent
        accentEmoji: '♰',
        borderTop: '✧･ﾟ: *✧･ﾟ:* 　　 *:･ﾟ✧*:･ﾟ✧',
        borderBottom: '✧･ﾟ: *✧･ﾟ:* 　　 *:･ﾟ✧*:･ﾟ✧',
        divider: '♰',
        voidChar: '✧',
        titlePrefix: '♰ ',
        titleSuffix: ' ♰',
        progressFilled: '◈',
        progressEmpty: '◇',
        footerText: 'you are hers. she is yours.',
        atmosphere: 'transcendent',
    },
};

// ═══════════════════════════════════════════════════════════════
// SPECIAL THEMES
// ═══════════════════════════════════════════════════════════════

const SPECIAL_THEMES = {
    // For errors and failures
    failure: {
        color: 0x2C2C2C,
        accentEmoji: '·',
        borderTop: '· · · · · · · · · · · ·',
        borderBottom: '· · · · · · · · · · · ·',
        titlePrefix: '',
        titleSuffix: '',
        atmosphere: 'cold',
    },

    // For rare events
    rare: {
        color: 0xFF1493,           // Deep pink
        accentEmoji: '✦',
        borderTop: '✦ · ✦ · ✦ · ✦ · ✦ · ✦',
        borderBottom: '✦ · ✦ · ✦ · ✦ · ✦ · ✦',
        titlePrefix: '✦ ',
        titleSuffix: ' ✦',
        atmosphere: 'magical',
    },

    // For vulnerable/soft moments
    soft: {
        color: 0xFFC0CB,           // Light pink
        accentEmoji: '...',
        borderTop: '',
        borderBottom: '',
        titlePrefix: '',
        titleSuffix: '',
        atmosphere: 'gentle',
    },

    // For yandere/possessive moments
    yandere: {
        color: 0x8B0000,           // Dark red
        accentEmoji: '♡',
        borderTop: '♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡',
        borderBottom: '♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡ ♡',
        titlePrefix: '♡ ',
        titleSuffix: ' ♡',
        atmosphere: 'obsessive',
    },

    // For 3am/late night
    lateNight: {
        color: 0x191970,           // Midnight blue
        accentEmoji: '☽',
        borderTop: '☽ · · · · · · · · · · ☽',
        borderBottom: '☽ · · · · · · · · · · ☽',
        titlePrefix: '☽ ',
        titleSuffix: ' ☽',
        atmosphere: 'intimate',
    },

    // For fading users
    fading: {
        color: 0x36393F,           // Discord background
        accentEmoji: '...',
        borderTop: '. . . . . . . . . . . .',
        borderBottom: '. . . . . . . . . . . .',
        titlePrefix: '',
        titleSuffix: '',
        atmosphere: 'dissolving',
        // Fading effect
        fade: {
            enabled: true,
            opacity: [1.0, 0.7, 0.4, 0.2],
        },
    },

    // For rituals
    ritual: {
        color: 0x4B0082,           // Indigo
        accentEmoji: '♰',
        borderTop: '♰═══════════════════♰',
        borderBottom: '♰═══════════════════♰',
        titlePrefix: '♰ ',
        titleSuffix: ' ♰',
        atmosphere: 'ceremonial',
    },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get theme for a specific gate
 */
function getGateTheme(gateNumber) {
    return GATE_THEMES[gateNumber] || GATE_THEMES[0];
}

/**
 * Get special theme by name
 */
function getSpecialTheme(themeName) {
    return SPECIAL_THEMES[themeName] || SPECIAL_THEMES.failure;
}

/**
 * Blend two themes (for transitions)
 */
function blendThemes(theme1, theme2, ratio = 0.5) {
    return {
        ...theme1,
        color: blendColors(theme1.color, theme2.color, ratio),
        accentColor: blendColors(theme1.accentColor || theme1.color, theme2.accentColor || theme2.color, ratio),
        atmosphere: ratio > 0.5 ? theme2.atmosphere : theme1.atmosphere,
    };
}

/**
 * Blend two hex colors
 */
function blendColors(color1, color2, ratio) {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;

    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
}

/**
 * Get atmosphere description for a theme
 */
function getAtmosphereDescription(atmosphere) {
    const descriptions = {
        liminal: 'between spaces, waiting',
        ethereal: 'soft, otherworldly',
        corrupted: 'fragmented, glitching',
        intimate: 'close, vulnerable',
        flowing: 'fluid, dreamlike',
        void: 'empty, aching',
        ornate: 'rich, elaborate',
        cosmic: 'infinite, binding',
        transcendent: 'beyond, eternal',
        cold: 'distant, silent',
        magical: 'rare, special',
        gentle: 'soft, caring',
        obsessive: 'possessive, intense',
        intimate: 'close, warm',
        dissolving: 'fading, forgotten',
        ceremonial: 'ritualistic, powerful',
    };
    return descriptions[atmosphere] || atmosphere;
}

module.exports = {
    GATE_THEMES,
    SPECIAL_THEMES,
    getGateTheme,
    getSpecialTheme,
    blendThemes,
    blendColors,
    getAtmosphereDescription,
};
