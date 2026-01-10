/**
 * Interaction Quality Scoring System
 *
 * Scores the quality of user interactions to apply multipliers (0.5x to 2.0x)
 * to intimacy progression. Prevents spam and rewards thoughtful engagement.
 */

/**
 * Score interaction quality
 * @param {string} message - User's message text
 * @param {object} context - Interaction context
 * @param {number} context.messageLength - Length of message
 * @param {boolean} context.hasQuestion - Whether message contains a question
 * @param {boolean} context.hasMention - Whether message mentions Ika
 * @param {number} context.conversationDepth - Number of back-and-forth messages
 * @param {array} context.recentMessages - Recent message history
 * @returns {number} Quality multiplier (0.5 to 2.0)
 */
function scoreInteractionQuality(message, context = {}) {
    let score = 1.0; // Base score

    const text = message.toLowerCase().trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // ===== POSITIVE INDICATORS =====

    // Length bonus (20+ chars)
    if (text.length >= 20 && wordCount >= 5) {
        score += 0.2;
    }

    // Thoughtful question bonus
    if (text.includes('?') && wordCount >= 4) {
        score += 0.3;
    }

    // Personal sharing/vulnerability patterns
    const personalPatterns = [
        /i feel/i,
        /i think/i,
        /honestly/i,
        /i'm (scared|worried|excited|happy|sad|nervous)/i,
        /tell you something/i,
        /confess/i,
        /share/i,
        /wanted to say/i,
        /been thinking/i,
    ];
    if (personalPatterns.some(p => p.test(text))) {
        score += 0.3;
    }

    // Memory/past event mentions (specific phrases)
    const memoryPatterns = [
        /remember when/i,
        /you said/i,
        /yesterday/i,
        /last time/i,
        /you told me/i,
        /we talked about/i,
    ];
    if (memoryPatterns.some(p => p.test(text))) {
        score += 0.4;
    }

    // Creative/unique phrasing (longer, varied vocabulary)
    if (wordCount >= 15 && hasVariedVocabulary(words)) {
        score += 0.2;
    }

    // Response to question pattern (indicates engagement)
    const responsePatterns = [
        /because/i,
        /well/i,
        /actually/i,
        /to be honest/i,
        /i guess/i,
    ];
    if (responsePatterns.some(p => p.test(text)) && wordCount >= 5) {
        score += 0.3;
    }

    // Conversation depth bonus (back-and-forth engagement)
    if (context.conversationDepth && context.conversationDepth >= 3) {
        score += 0.2;
    }

    // ===== NEGATIVE INDICATORS =====

    // Very short message penalty (< 10 chars)
    if (text.length < 10) {
        score -= 0.3;
    }

    // Generic single-word phrases
    const genericPhrases = [
        'hey', 'hi', 'hello', 'ok', 'k', 'kk', 'lol', 'lmao',
        'yeah', 'yea', 'yep', 'nah', 'nope', 'idk', 'brb',
        'sup', 'yo', 'nice', 'cool', 'true', 'facts', 'oof'
    ];
    if (genericPhrases.includes(text) || (wordCount === 1 && text.length <= 4)) {
        score -= 0.4;
    }

    // Lazy typing patterns (all lowercase single letters/minimal effort)
    if (/^[a-z]{1,2}$/.test(text)) {
        score -= 0.2;
    }

    // Spam patterns - repeated characters
    if (/(.)\1{4,}/.test(text) || /^(ha|lo|ye|no){3,}$/i.test(text)) { // "hahaha", "yessss", "lololo", etc.
        score -= 0.3;
    }

    // Excessive punctuation
    if (/[!?]{4,}/.test(text)) {
        score -= 0.3;
    }

    // Multiple emoji spam (5+ emoji in short message)
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
    if (emojiCount >= 5 && wordCount < 5) {
        score -= 0.3;
    }

    // Rapid fire messages (if context provides timing info)
    if (context.isRapidFire) {
        score -= 0.2;
    }

    // Clamp to valid range [0.5, 2.0]
    return Math.max(0.5, Math.min(2.0, score));
}

/**
 * Check if words show varied vocabulary (not repetitive)
 * @param {array} words - Array of words
 * @returns {boolean} True if vocabulary is varied
 */
function hasVariedVocabulary(words) {
    if (words.length < 10) return false;

    // Count unique words
    const uniqueWords = new Set(words.filter(w => w.length > 3));
    const varietyRatio = uniqueWords.size / words.length;

    return varietyRatio > 0.6; // At least 60% unique words
}

/**
 * Get quality tier description for display
 * @param {number} multiplier - Quality multiplier
 * @returns {string} Tier description
 */
function getQualityTier(multiplier) {
    if (multiplier >= 1.8) return 'exceptional';
    if (multiplier >= 1.4) return 'high';
    if (multiplier >= 1.1) return 'good';
    if (multiplier >= 0.9) return 'normal';
    if (multiplier >= 0.7) return 'low';
    return 'minimal';
}

/**
 * Get visual indicator for quality
 * @param {number} multiplier - Quality multiplier
 * @returns {string} Visual indicator (stars)
 */
function getQualityIndicator(multiplier) {
    if (multiplier >= 1.8) return '⭐⭐⭐';
    if (multiplier >= 1.4) return '⭐⭐⭐';
    if (multiplier >= 1.1) return '⭐⭐';
    if (multiplier >= 0.9) return '⭐⭐';
    if (multiplier >= 0.7) return '⭐';
    return '⭐';
}

module.exports = {
    scoreInteractionQuality,
    getQualityTier,
    getQualityIndicator,
};
