/**
 * Check if string is a valid URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
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
 */
function validateGate2Answer(answer) {
    const acceptedAnswers = [
        'love',
        'sunlight', 'sun', 'light',
        'heat', 'warmth', 'warm',
        'fire', 'flame',
        'life', 'alive', 'living',
        'touch',
        'devotion',
        'desire', 'want', 'wanting',
        'hunger', 'hungry',
        'oxygen', 'air', 'breath', 'breathing',
        'everything',
        'real', 'reality',
        'attention',
        'eyes',
        'worship',
        'adoration',
        'passion',
    ];

    return fuzzyMatch(answer, acceptedAnswers);
}

/**
 * Validate Gate 4 answer (the waters)
 */
function validateGate4Answer(answer) {
    const acceptedAnswers = [
        'sui',
        'sui network',
        'sui chain',
        '$sui',
    ];

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
    sanitize,
};
