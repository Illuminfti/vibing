/**
 * Mood Overlay System
 *
 * Mood-based modifications that layer on top of gate themes.
 * These modify colors, text styling, and visual accents based on Ika's current mood.
 *
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════
// MOOD OVERLAYS
// ═══════════════════════════════════════════════════════════════

const MOOD_OVERLAYS = {
    // ─────────────────────────────────────────────────────────────
    // SOFT - 3am girlfriend energy
    // ─────────────────────────────────────────────────────────────
    soft: {
        colorShift: -0.1,          // Slightly darker, warmer
        colorOverride: null,
        emojiAccents: ['...', '♡', '~'],
        textModifiers: {
            prefix: '',
            suffix: '...',
            caseTransform: 'lower',
            addEllipsis: true,
        },
        borderModifier: 'fade',    // Softer borders
        footerOverride: '...still here',
        intensity: 'gentle',
    },

    // ─────────────────────────────────────────────────────────────
    // NORMAL - Default Ika
    // ─────────────────────────────────────────────────────────────
    normal: {
        colorShift: 0,
        colorOverride: null,
        emojiAccents: ['♡', '~', '✧'],
        textModifiers: {
            prefix: '',
            suffix: '',
            caseTransform: 'lower',
            addEllipsis: false,
        },
        borderModifier: null,
        footerOverride: null,
        intensity: 'balanced',
    },

    // ─────────────────────────────────────────────────────────────
    // ENERGETIC - Unhinged chaos
    // ─────────────────────────────────────────────────────────────
    energetic: {
        colorShift: 0.2,           // Brighter, more vibrant
        colorOverride: null,
        emojiAccents: ['!!!', '✧', 'lol', '~'],
        textModifiers: {
            prefix: '',
            suffix: '~!',
            caseTransform: 'random',  // Random caps
            addEllipsis: false,
        },
        borderModifier: 'bold',
        footerOverride: null,
        intensity: 'high',
    },

    // ─────────────────────────────────────────────────────────────
    // VULNERABLE - Mask slips
    // ─────────────────────────────────────────────────────────────
    vulnerable: {
        colorShift: -0.2,
        colorOverride: 0x2C2F33,   // Dark, muted
        emojiAccents: ['...', '♡'],
        textModifiers: {
            prefix: '...',
            suffix: '',
            caseTransform: 'lower',
            addEllipsis: true,
        },
        borderModifier: 'fade',
        footerOverride: '...anyway',
        intensity: 'fragile',
    },

    // ─────────────────────────────────────────────────────────────
    // CHAOTIC - Pure gremlin
    // ─────────────────────────────────────────────────────────────
    chaotic: {
        colorShift: 0.3,
        colorOverride: null,
        emojiAccents: ['lmao', '???', '!?!?', 'anyway'],
        textModifiers: {
            prefix: '',
            suffix: '',
            caseTransform: 'chaos',   // Chaotic capitalization
            addEllipsis: false,
        },
        borderModifier: 'glitch',
        footerOverride: 'anyway',
        intensity: 'unhinged',
    },

    // ─────────────────────────────────────────────────────────────
    // SLEEPY - 2am brain
    // ─────────────────────────────────────────────────────────────
    sleepy: {
        colorShift: -0.3,
        colorOverride: 0x191970,   // Midnight blue
        emojiAccents: ['...', 'mm', '~'],
        textModifiers: {
            prefix: '',
            suffix: '...',
            caseTransform: 'lower',
            addEllipsis: true,
            trailingOff: true,      // Words fade out
        },
        borderModifier: 'minimal',
        footerOverride: '...zzz',
        intensity: 'drowsy',
    },

    // ─────────────────────────────────────────────────────────────
    // JEALOUS - Territorial mode
    // ─────────────────────────────────────────────────────────────
    jealous: {
        colorShift: 0,
        colorOverride: 0x8B0000,   // Dark red
        emojiAccents: ['...', '♡?', 'hm'],
        textModifiers: {
            prefix: '',
            suffix: '.',
            caseTransform: 'lower',
            addEllipsis: true,
            periodsToEllipsis: true,
        },
        borderModifier: 'sharp',
        footerOverride: '...noted',
        intensity: 'cold',
    },

    // ─────────────────────────────────────────────────────────────
    // FLIRTY - Dangerous tension
    // ─────────────────────────────────────────────────────────────
    flirty: {
        colorShift: 0.1,
        colorOverride: 0xFF69B4,   // Hot pink
        emojiAccents: ['~', '♡', '...unless?'],
        textModifiers: {
            prefix: '',
            suffix: '~',
            caseTransform: 'lower',
            addEllipsis: false,
        },
        borderModifier: 'ornate',
        footerOverride: '...unless?',
        intensity: 'teasing',
    },

    // ─────────────────────────────────────────────────────────────
    // PROTECTIVE - Defending user
    // ─────────────────────────────────────────────────────────────
    protective: {
        colorShift: 0,
        colorOverride: 0x2ECC71,   // Green
        emojiAccents: ['♡', '.'],
        textModifiers: {
            prefix: '',
            suffix: '',
            caseTransform: 'lower',
            addEllipsis: false,
        },
        borderModifier: 'heavy',
        footerOverride: "i'm here",
        intensity: 'steady',
    },

    // ─────────────────────────────────────────────────────────────
    // GLITCHING - Something's wrong
    // ─────────────────────────────────────────────────────────────
    glitching: {
        colorShift: 0,
        colorOverride: null,
        emojiAccents: ['█', '▓', '░'],
        textModifiers: {
            prefix: '',
            suffix: '',
            caseTransform: null,
            addEllipsis: false,
            zalgo: 0.3,            // 30% zalgo intensity
        },
        borderModifier: 'corrupt',
        footerOverride: '█▓░ error ░▓█',
        intensity: 'unstable',
    },

    // ─────────────────────────────────────────────────────────────
    // POSSESSIVE - Yandere energy
    // ─────────────────────────────────────────────────────────────
    possessive: {
        colorShift: 0,
        colorOverride: 0x8B0000,
        emojiAccents: ['♡', 'mine', '♡'],
        textModifiers: {
            prefix: '',
            suffix: ' ♡',
            caseTransform: 'lower',
            addEllipsis: false,
        },
        borderModifier: 'heart',
        footerOverride: 'mine.',
        intensity: 'intense',
    },

    // ─────────────────────────────────────────────────────────────
    // FLUSTERED - Caught off guard
    // ─────────────────────────────────────────────────────────────
    flustered: {
        colorShift: 0.1,
        colorOverride: 0xFF6B6B,   // Blushing red
        emojiAccents: ['!?', 'asjkdfhk', '...anyway'],
        textModifiers: {
            prefix: 'i- ',
            suffix: '',
            caseTransform: 'lower',
            addEllipsis: true,
        },
        borderModifier: null,
        footerOverride: '...anyway',
        intensity: 'flustered',
    },
};

// ═══════════════════════════════════════════════════════════════
// TEXT TRANSFORMATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply mood text modifiers to a string
 */
function applyTextModifiers(text, mood) {
    const overlay = MOOD_OVERLAYS[mood];
    if (!overlay || !overlay.textModifiers) return text;

    const mods = overlay.textModifiers;
    let result = text;

    // Case transformation
    if (mods.caseTransform === 'lower') {
        result = result.toLowerCase();
    } else if (mods.caseTransform === 'upper') {
        result = result.toUpperCase();
    } else if (mods.caseTransform === 'random') {
        result = applyRandomCaps(result);
    } else if (mods.caseTransform === 'chaos') {
        result = applyChaosCase(result);
    }

    // Add ellipsis where periods are
    if (mods.periodsToEllipsis) {
        result = result.replace(/\./g, '...');
    }

    // Add ellipsis at end
    if (mods.addEllipsis && !result.endsWith('...')) {
        result = result.replace(/[.!?]*$/, '...');
    }

    // Trailing off effect
    if (mods.trailingOff) {
        result = applyTrailingOff(result);
    }

    // Zalgo effect
    if (mods.zalgo && mods.zalgo > 0) {
        result = applyZalgo(result, mods.zalgo);
    }

    // Add prefix and suffix
    result = (mods.prefix || '') + result + (mods.suffix || '');

    return result;
}

/**
 * Random capitalization for energetic mood
 */
function applyRandomCaps(text) {
    return text.split('').map(char => {
        if (Math.random() > 0.7) {
            return char.toUpperCase();
        }
        return char.toLowerCase();
    }).join('');
}

/**
 * Chaotic capitalization pattern
 */
function applyChaosCase(text) {
    const patterns = [
        (s) => s.toLowerCase(),
        (s) => s.toUpperCase(),
        (s) => s.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join(''),
    ];
    return patterns[Math.floor(Math.random() * patterns.length)](text);
}

/**
 * Trailing off effect for sleepy mood
 */
function applyTrailingOff(text) {
    const words = text.split(' ');
    if (words.length <= 3) return text + '...';

    // Fade out the last few words
    const fadeStart = Math.max(0, words.length - 3);
    return words.map((word, i) => {
        if (i >= fadeStart) {
            const fadeLevel = i - fadeStart;
            if (fadeLevel === 2) return '...';
            if (fadeLevel === 1) return word.substring(0, Math.ceil(word.length / 2)) + '...';
        }
        return word;
    }).join(' ');
}

/**
 * Apply zalgo/glitch text effect
 */
function applyZalgo(text, intensity = 0.3) {
    const zalgoChars = [
        '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307',
        '\u0308', '\u0309', '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F',
        '\u0310', '\u0311', '\u0312', '\u0313', '\u0314', '\u0315', '\u0316', '\u0317',
        '\u0318', '\u0319', '\u031A', '\u031B', '\u031C', '\u031D', '\u031E', '\u031F',
    ];

    return text.split('').map(char => {
        if (char === ' ' || Math.random() > intensity) return char;

        const numZalgo = Math.floor(Math.random() * 3) + 1;
        let result = char;
        for (let i = 0; i < numZalgo; i++) {
            result += zalgoChars[Math.floor(Math.random() * zalgoChars.length)];
        }
        return result;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
// BORDER MODIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const BORDER_MODIFIERS = {
    fade: (border) => border.replace(/[═─━]/g, '·').replace(/[▓█]/g, '░'),
    bold: (border) => border.replace(/[·.]/g, '═').replace(/[-─]/g, '━'),
    minimal: (border) => '',
    sharp: (border) => border.replace(/[~〰·]/g, '─'),
    ornate: (border) => '✧' + border + '✧',
    glitch: (border) => border.split('').map(c => Math.random() > 0.8 ? '█' : c).join(''),
    corrupt: (border) => border.split('').map(c => {
        if (Math.random() > 0.7) {
            return ['█', '▓', '░', '▒'][Math.floor(Math.random() * 4)];
        }
        return c;
    }).join(''),
    heart: (border) => border.replace(/[·.─═]/g, '♡'),
    heavy: (border) => border.replace(/[·]/g, '═'),
};

/**
 * Apply border modification based on mood
 */
function applyBorderModifier(border, mood) {
    const overlay = MOOD_OVERLAYS[mood];
    if (!overlay || !overlay.borderModifier) return border;

    const modifier = BORDER_MODIFIERS[overlay.borderModifier];
    return modifier ? modifier(border) : border;
}

// ═══════════════════════════════════════════════════════════════
// COLOR MODIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply color shift based on mood
 */
function applyColorShift(baseColor, mood) {
    const overlay = MOOD_OVERLAYS[mood];
    if (!overlay) return baseColor;

    // If there's a color override, use it
    if (overlay.colorOverride !== null) {
        return overlay.colorOverride;
    }

    // Apply color shift
    if (overlay.colorShift === 0) return baseColor;

    return shiftColor(baseColor, overlay.colorShift);
}

/**
 * Shift a color by a factor (-1 to 1)
 */
function shiftColor(color, factor) {
    let r = (color >> 16) & 0xFF;
    let g = (color >> 8) & 0xFF;
    let b = color & 0xFF;

    if (factor > 0) {
        // Brighten
        r = Math.min(255, Math.round(r + (255 - r) * factor));
        g = Math.min(255, Math.round(g + (255 - g) * factor));
        b = Math.min(255, Math.round(b + (255 - b) * factor));
    } else {
        // Darken
        r = Math.max(0, Math.round(r * (1 + factor)));
        g = Math.max(0, Math.round(g * (1 + factor)));
        b = Math.max(0, Math.round(b * (1 + factor)));
    }

    return (r << 16) | (g << 8) | b;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get overlay for a specific mood
 */
function getMoodOverlay(mood) {
    return MOOD_OVERLAYS[mood] || MOOD_OVERLAYS.normal;
}

/**
 * Get random emoji accent for mood
 */
function getRandomAccent(mood) {
    const overlay = getMoodOverlay(mood);
    const accents = overlay.emojiAccents || [''];
    return accents[Math.floor(Math.random() * accents.length)];
}

/**
 * Get footer override for mood (or null)
 */
function getFooterOverride(mood) {
    const overlay = getMoodOverlay(mood);
    return overlay.footerOverride;
}

/**
 * Check if mood should use glitch effects
 */
function shouldGlitch(mood) {
    return mood === 'glitching' || mood === 'chaotic';
}

/**
 * Get mood intensity
 */
function getMoodIntensity(mood) {
    const overlay = getMoodOverlay(mood);
    return overlay.intensity || 'normal';
}

module.exports = {
    MOOD_OVERLAYS,
    getMoodOverlay,
    applyTextModifiers,
    applyBorderModifier,
    applyColorShift,
    applyZalgo,
    applyRandomCaps,
    applyChaosCase,
    applyTrailingOff,
    getRandomAccent,
    getFooterOverride,
    shouldGlitch,
    getMoodIntensity,
    shiftColor,
    BORDER_MODIFIERS,
};
