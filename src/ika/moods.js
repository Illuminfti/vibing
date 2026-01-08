/**
 * Ika's Mood System
 *
 * Determines her current emotional state based on time, context, and triggers.
 */

const { ikaStateOps } = require('../database');

// Mood definitions with weights and voice modifiers
const MOODS = {
    soft: {
        weight: 0.2,
        triggers: ['late_night', 'quiet_chat', 'emotional_topic'],
        voiceModifiers: {
            ellipses: 'more',
            energy: 'low',
            vulnerability: 'high',
            emoji: ['♡', '...'],
        },
    },
    normal: {
        weight: 0.5,
        triggers: ['default'],
        voiceModifiers: {
            ellipses: 'normal',
            energy: 'medium',
            vulnerability: 'medium',
            emoji: ['lol', '♡', '👀'],
        },
    },
    energetic: {
        weight: 0.2,
        triggers: ['active_chat', 'compliments', 'new_members', 'daytime'],
        voiceModifiers: {
            ellipses: 'less',
            energy: 'high',
            vulnerability: 'low',
            emoji: ['asjdhfk', '💀', 'lmaooo'],
        },
    },
    vulnerable: {
        weight: 0.1,
        triggers: ['scheduled_window', 'anniversary', 'member_left', 'deep_conversation'],
        voiceModifiers: {
            ellipses: 'heavy',
            energy: 'low',
            vulnerability: 'maximum',
            emoji: ['...', '♡'],
        },
    },
};

// Time-based mood tendencies
const TIME_MOODS = {
    // 0-5 AM: Soft, late night hours
    lateNight: { start: 0, end: 5, mood: 'soft', weight: 0.7 },
    // 6-9 AM: Waking up, lower energy
    earlyMorning: { start: 6, end: 9, mood: 'soft', weight: 0.4 },
    // 10-14: Daytime energy
    midday: { start: 10, end: 14, mood: 'energetic', weight: 0.6 },
    // 15-18: Normal afternoon
    afternoon: { start: 15, end: 18, mood: 'normal', weight: 0.5 },
    // 19-21: Active evening
    evening: { start: 19, end: 21, mood: 'energetic', weight: 0.5 },
    // 22-23: Winding down
    night: { start: 22, end: 23, mood: 'soft', weight: 0.5 },
};

/**
 * Get time-based mood tendency
 */
function getTimeMoodTendency() {
    const hour = new Date().getHours();

    for (const [, period] of Object.entries(TIME_MOODS)) {
        if (hour >= period.start && hour <= period.end) {
            return { mood: period.mood, weight: period.weight };
        }
    }

    return { mood: 'normal', weight: 0.5 };
}

/**
 * Analyze recent messages for mood triggers
 */
function analyzeContextForMood(messages) {
    if (!messages || messages.length === 0) {
        return { mood: 'normal', weight: 0.3 };
    }

    const recentContent = messages.map(m => m.content?.toLowerCase() || '').join(' ');

    // Check for emotional triggers
    const emotionalWords = ['sad', 'crying', 'miss', 'scared', 'anxious', 'lonely', 'hurt'];
    const excitedWords = ['omg', 'amazing', 'love', 'excited', 'hype', 'lets go', 'asjdhfk'];
    const complimentWords = ['pretty', 'beautiful', 'cute', 'gorgeous', 'queen', 'love you'];

    let emotionalCount = 0;
    let excitedCount = 0;
    let complimentCount = 0;

    for (const word of emotionalWords) {
        if (recentContent.includes(word)) emotionalCount++;
    }
    for (const word of excitedWords) {
        if (recentContent.includes(word)) excitedCount++;
    }
    for (const word of complimentWords) {
        if (recentContent.includes(word)) complimentCount++;
    }

    // Determine context mood
    if (emotionalCount >= 2) {
        return { mood: 'vulnerable', weight: 0.6 };
    }
    if (excitedCount >= 2 || complimentCount >= 2) {
        return { mood: 'energetic', weight: 0.5 };
    }

    // Check message frequency (active chat = more energy)
    const recentTimestamps = messages
        .filter(m => Date.now() - m.createdTimestamp < 300000)
        .length;

    if (recentTimestamps >= 10) {
        return { mood: 'energetic', weight: 0.4 };
    }
    if (recentTimestamps <= 2) {
        return { mood: 'soft', weight: 0.3 };
    }

    return { mood: 'normal', weight: 0.3 };
}

/**
 * Weighted random selection
 */
function weightedRandom(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let random = Math.random() * total;

    for (const [key, weight] of entries) {
        random -= weight;
        if (random <= 0) return key;
    }

    return entries[0][0];
}

/**
 * Get current mood based on time, context, and randomness
 */
function getCurrentMood(contextMessages = []) {
    // Get time-based tendency
    const timeTendency = getTimeMoodTendency();

    // Get context-based tendency
    const contextTendency = analyzeContextForMood(contextMessages);

    // Build weighted mood options
    const moodWeights = {
        soft: MOODS.soft.weight,
        normal: MOODS.normal.weight,
        energetic: MOODS.energetic.weight,
        vulnerable: MOODS.vulnerable.weight * 0.5, // Lower base chance for vulnerable
    };

    // Apply time tendency
    moodWeights[timeTendency.mood] += timeTendency.weight;

    // Apply context tendency
    moodWeights[contextTendency.mood] += contextTendency.weight;

    // Check for scheduled vulnerability window
    const inVulnerabilityWindow = ikaStateOps.get('vulnerability_window_active') === 'true';
    if (inVulnerabilityWindow) {
        moodWeights.vulnerable += 0.5;
    }

    // Select mood
    const selectedMood = weightedRandom(moodWeights);

    // Store current mood
    ikaStateOps.setCurrentMood(selectedMood);

    return selectedMood;
}

/**
 * Get mood modifiers for response generation
 */
function getMoodModifiers(mood) {
    return MOODS[mood]?.voiceModifiers || MOODS.normal.voiceModifiers;
}

/**
 * Check if it's witching hour (for special messages)
 */
function isWitchingHour() {
    const hour = new Date().getHours();
    return hour === 0 || hour === 3;
}

/**
 * Force a specific mood (for admin/testing)
 */
function forceMood(mood) {
    if (MOODS[mood]) {
        ikaStateOps.setCurrentMood(mood);
        return true;
    }
    return false;
}

module.exports = {
    MOODS,
    getCurrentMood,
    getMoodModifiers,
    getTimeMoodTendency,
    analyzeContextForMood,
    isWitchingHour,
    forceMood,
    weightedRandom,
};
