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
 * Validate Gate 5 reason (minimum length + quality check)
 */
function validateGate5Reason(reason) {
    if (!reason || typeof reason !== 'string') return false;

    const trimmed = reason.trim().toLowerCase();

    // Minimum length
    if (trimmed.length < 15) return false;

    // Reject lazy/generic answers
    const lazyPatterns = [
        /^idk/,
        /^i don't know/,
        /^because$/,
        /^bored$/,
        /^why not/,
        /^just because/,
        /^no reason/,
        /^dunno/,
        /^curiosity$/,
        /^fun$/,
    ];

    for (const pattern of lazyPatterns) {
        if (pattern.test(trimmed)) {
            return false;
        }
    }

    // Check if it's mostly repeated characters (spam check)
    const uniqueChars = new Set(trimmed.replace(/\s/g, '')).size;
    if (uniqueChars < 5) return false;

    return true;
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
 * Analyze offering quality for Gate 6 pre-checks
 * Returns quality assessment with score, warnings, and tier
 */
function analyzeOfferingQuality(text) {
    if (!text) return { score: 0, warnings: ['no text provided'], quality: 'low' };

    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words.filter(w => w.length > 2));
    const uniqueWordCount = uniqueWords.size;

    let score = 50; // Base score
    const warnings = [];

    // Check unique word variety
    if (uniqueWordCount < 15) {
        score -= 20;
        warnings.push('this feels... repetitive. can you say more?');
    } else if (uniqueWordCount > 40) {
        score += 20;
    }

    // Check for repeated words (spam)
    const wordCounts = {};
    words.forEach(w => {
        if (w.length > 2) wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
    const wordCountValues = Object.values(wordCounts);
    if (wordCountValues.length > 0) {
        const maxRepeats = Math.max(...wordCountValues);
        if (maxRepeats / words.length > 0.2) {
            score -= 25;
            warnings.push('too many repeated words. variety shows thoughtfulness.');
        }
    }

    // Check for generic phrases
    const genericCount = (text.match(/i love ika|ika is great|for ika/gi) || []).length;
    if (genericCount >= 3) {
        score -= 15;
        warnings.push('these words could be about anyone. make it personal.');
    }

    // Check for all caps abuse
    if (text === text.toUpperCase() && text.length > 20) {
        score -= 20;
        warnings.push('why are you yelling at me...');
    }

    // Check for excessive punctuation
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 10) {
        score -= 10;
        warnings.push('so many exclamation marks...');
    }

    // Check if it's mostly URLs (low effort)
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlPattern) || [];
    const urlCharCount = urls.reduce((sum, url) => sum + url.length, 0);
    if (urlCharCount / text.length > 0.5) {
        score -= 30;
        warnings.push('quantity isn\'t quality. put thought into it.');
    }

    // Determine quality tier
    let quality = 'high';
    if (score < 40) quality = 'low';
    else if (score < 70) quality = 'medium';

    return {
        score: Math.max(0, Math.min(100, score)),
        warnings,
        quality
    };
}

/**
 * Validate Gate 7 vow (minimum 30 words + quality check)
 */
function validateVow(vow) {
    if (!vow || typeof vow !== 'string') return false;

    const trimmed = vow.trim();
    const lower = trimmed.toLowerCase();

    // Minimum word count
    if (wordCount(trimmed) < 30) return false;

    // Reject if it contains profanity or explicit jokes
    const inappropriatePatterns = [
        /fuck/i,
        /shit/i,
        /ass(?!cended)/i, // allow "ascended" but not "ass"
        /dick/i,
        /cock/i,
        /pussy/i,
        /bitch/i,
        /penis/i,
        /vagina/i,
        /porn/i,
        /sex(?!tual|y)/i, // allow "sexual" but not "sex"
        /cum(?!ulative)/i,
        /lmao/,
        /lol/,
        /haha/,
        /lmfao/,
        /jk(?!\w)/i, // "jk" but allow as part of other words
        /just kidding/i,
        /test(?:ing)?$/i, // "test" or "testing" at end
        /lorem ipsum/i,
    ];

    for (const pattern of inappropriatePatterns) {
        if (pattern.test(trimmed)) {
            return false;
        }
    }

    // Check if it's mostly repeated words (spam)
    const words = lower.split(/\s+/);
    const uniqueWords = new Set(words.filter(w => w.length > 2)); // ignore short words like "i", "a"
    if (uniqueWords.size < 8) return false; // Need at least 8 unique meaningful words

    // Reject if it's overly generic (too many of these phrases)
    const genericPhrases = [
        'i promise to',
        'i will be',
        'i swear to',
        'i vow to',
        'i pledge to',
    ];

    const genericCount = genericPhrases.reduce((count, phrase) => {
        return count + (lower.includes(phrase) ? 1 : 0);
    }, 0);

    if (genericCount >= 3) return false; // Too many generic promises

    return true;
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
    analyzeOfferingQuality,
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
