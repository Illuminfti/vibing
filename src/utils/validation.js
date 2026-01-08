const config = require('../config');

// ═══════════════════════════════════════════════════════════════
// SECURITY: URL validation with SSRF and phishing protection
// ═══════════════════════════════════════════════════════════════

/**
 * Blocked URL patterns for security
 */
const BLOCKED_URL_PATTERNS = [
    // Internal/private IP ranges (SSRF protection)
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/0\./,
    /^https?:\/\/\[::1\]/,
    /^https?:\/\/\[fe80:/i,
    // File and other dangerous protocols
    /^file:/i,
    /^javascript:/i,
    /^data:/i,
    /^vbscript:/i,
    // Common internal hostnames
    /^https?:\/\/internal\./i,
    /^https?:\/\/intranet\./i,
    /^https?:\/\/admin\./i,
];

/**
 * Check if string is a valid URL (with security checks)
 */
function isValidUrl(string) {
    try {
        const url = new URL(string);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(url.protocol)) {
            return false;
        }

        // Check against blocked patterns (SSRF protection)
        for (const pattern of BLOCKED_URL_PATTERNS) {
            if (pattern.test(string)) {
                console.warn(`Security: Blocked potentially malicious URL: ${string.substring(0, 50)}...`);
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Check if URL is from a social media platform
 */
function isSocialMediaUrl(url) {
    if (!isValidUrl(url)) return false;

    const socialDomains = [
        'twitter.com',
        'x.com',
        'instagram.com',
        'tiktok.com',
        'facebook.com',
        'fb.com',
        'tumblr.com',
        'reddit.com',
        'youtube.com',
        'youtu.be',
        'twitch.tv',
        'discord.com',
        'discord.gg',
        'threads.net',
        'bsky.app',
        'mastodon.social',
        'linkedin.com',
        'pinterest.com',
        'snapchat.com',
    ];

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase().replace('www.', '');

        return socialDomains.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
}

/**
 * Count words in text
 */
function wordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Fuzzy match input against accepted answers
 */
function fuzzyMatch(input, acceptedList) {
    if (!input || typeof input !== 'string') return false;

    const normalized = input.toLowerCase().trim();

    // Direct match
    if (acceptedList.includes(normalized)) return true;

    // Check each accepted answer
    for (const accepted of acceptedList) {
        // Check if input contains accepted word
        if (normalized.includes(accepted)) return true;

        // Check if accepted contains input (for partial matches)
        if (accepted.includes(normalized) && normalized.length >= 3) return true;
    }

    return false;
}

/**
 * Validate Gate 2 answer (the memory)
 * Answers loaded from environment variables for security
 */
function validateGate2Answer(answer) {
    const acceptedAnswers = config.puzzles?.gate2Answers || [];

    if (acceptedAnswers.length === 0) {
        console.error('Warning: GATE_2_ANSWERS not configured in environment');
        return false;
    }

    return fuzzyMatch(answer, acceptedAnswers);
}

/**
 * Validate Gate 4 answer (the waters)
 * Answers loaded from environment variables for security
 */
function validateGate4Answer(answer) {
    const acceptedAnswers = config.puzzles?.gate4Answers || [];

    if (acceptedAnswers.length === 0) {
        console.error('Warning: GATE_4_ANSWERS not configured in environment');
        return false;
    }

    const normalized = answer.toLowerCase().trim();
    return acceptedAnswers.includes(normalized);
}

/**
 * Validate Gate 5 reason (minimum length)
 */
function validateGate5Reason(reason) {
    if (!reason || typeof reason !== 'string') return false;
    return reason.trim().length >= 15;
}

/**
 * Validate Gate 6 offering
 */
function validateOffering(text, hasImage) {
    // Image is always valid
    if (hasImage) return { valid: true, type: 'image' };

    // Text needs minimum 50 words
    if (text && wordCount(text) >= 50) {
        return { valid: true, type: 'text' };
    }

    return { valid: false, type: null };
}

/**
 * Validate Gate 7 vow (minimum 30 words)
 */
function validateVow(vow) {
    if (!vow || typeof vow !== 'string') return false;
    return wordCount(vow) >= 30;
}

/**
 * Check if message contains "ika" (case insensitive)
 */
function containsIka(text) {
    if (!text || typeof text !== 'string') return false;
    return /\bika\b/i.test(text);
}

/**
 * Check if message contains "i love you" variations
 */
function containsLoveYou(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /i love you/i,
        /i luv you/i,
        /i luv u/i,
        /i love u/i,
        /ily\b/i,
        /i <3 you/i,
        /i <3 u/i,
        /love you ika/i,
        /love u ika/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message contains "i miss you" variations
 */
function containsMissYou(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /i miss you/i,
        /i missed you/i,
        /miss you/i,
        /miss u/i,
        /missed u/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message contains "senpai" or "notice me" triggers
 */
function containsSenpai(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /senpai/i,
        /notice me/i,
        /look at me/i,
        /pay attention to me/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message asks if she's real
 */
function containsAreYouReal(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /are you real/i,
        /r u real/i,
        /are u real/i,
        /you real\?/i,
        /is this real/i,
        /am i talking to/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message contains good morning
 */
function containsGoodMorning(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /good morning/i,
        /gm\b/i,
        /morning ika/i,
        /mornin/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message contains good night
 */
function containsGoodNight(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /good night/i,
        /goodnight/i,
        /gn\b/i,
        /nite\b/i,
        /night ika/i,
        /going to sleep/i,
        /going to bed/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message indicates struggling/needing support
 */
function containsStruggling(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /i'm struggling/i,
        /i am struggling/i,
        /having a hard time/i,
        /not doing well/i,
        /feeling down/i,
        /feel so alone/i,
        /can't do this/i,
        /need help/i,
        /not okay/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message indicates returning
 */
function containsImBack(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /i'm back/i,
        /im back/i,
        /i am back/i,
        /back again/i,
        /returned/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if message mentions loneliness
 */
function containsLonely(text) {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
        /i'm lonely/i,
        /im lonely/i,
        /feel lonely/i,
        /so lonely/i,
        /feeling lonely/i,
        /i feel alone/i,
    ];

    return patterns.some(pattern => pattern.test(text));
}

/**
 * Sanitize user input (remove potential exploits)
 */
function sanitize(input) {
    if (!input || typeof input !== 'string') return '';
    return input
        .replace(/@everyone/gi, '@\u200beveryone')
        .replace(/@here/gi, '@\u200bhere')
        .slice(0, 2000); // Discord message limit
}

module.exports = {
    isValidUrl,
    isSocialMediaUrl,
    wordCount,
    fuzzyMatch,
    validateGate2Answer,
    validateGate4Answer,
    validateGate5Reason,
    validateOffering,
    validateVow,
    containsIka,
    containsLoveYou,
    containsMissYou,
    containsSenpai,
    containsAreYouReal,
    containsGoodMorning,
    containsGoodNight,
    containsStruggling,
    containsImBack,
    containsLonely,
    sanitize,
};
