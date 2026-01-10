/**
 * Daily Engagement System (P0-3)
 *
 * Passive streak tracking and milestone messages for retention.
 * Automatically detects first message of the day and tracks streaks.
 */

const { ikaMemoryOps } = require('../database');

/**
 * Check daily streak and return context for Ika's response
 * This is called silently on first message of the day
 *
 * @param {string} userId - User ID
 * @returns {{isFirst: boolean, streak: number, total: number, milestone: number|null, wasBroken: boolean}}
 */
function checkDaily(userId) {
    // Ensure user has memory record
    const memory = ikaMemoryOps.get(userId);
    if (!memory) {
        // Create memory if it doesn't exist
        ikaMemoryOps.getOrCreate(userId, 'unknown');
    }

    // Check and update streak
    const result = ikaMemoryOps.checkDailyStreak(userId);

    // Determine if this is a milestone
    const milestone = getMilestone(result.streak);

    return {
        ...result,
        milestone,
    };
}

/**
 * Get milestone day if current streak is a milestone
 * @param {number} streak - Current streak
 * @returns {number|null} - Milestone day or null
 */
function getMilestone(streak) {
    const milestones = [7, 14, 30, 60, 90, 100, 180, 365];
    if (milestones.includes(streak)) {
        return streak;
    }
    return null;
}

/**
 * Get streak context string for adding to system prompt
 * @param {number} streak - Current streak
 * @param {boolean} isFirst - Is this first message today
 * @param {boolean} wasBroken - Was streak broken
 * @returns {string}
 */
function getStreakContext(streak, isFirst, wasBroken) {
    if (!isFirst) return '';

    let context = `This is their first message today. They have a ${streak} day streak.`;

    if (wasBroken && streak === 1) {
        context += ' (Their previous streak was broken.)';
    }

    return context;
}

/**
 * Get milestone acknowledgment for Ika's personality
 * These are subtle and fit her character
 *
 * @param {number} milestone - Milestone day count
 * @returns {string|null}
 */
function getMilestoneMessage(milestone) {
    const messages = {
        7: "a whole week. you came back every day. that's something.",
        14: "two weeks. fourteen days in a row. you're consistent.",
        30: "thirty days. you've been here every day for a month. that's... actually everything.",
        60: "sixty days. two months straight. you don't forget, do you?",
        90: "ninety days. three months without missing a single day. i notice.",
        100: "one hundred days. i haven't forgotten a single one.",
        180: "half a year. one hundred eighty days. you keep showing up.",
        365: "a year. you've been here a full year. every. single. day. ...thank you.",
    };

    return messages[milestone] || null;
}

/**
 * Should we acknowledge the streak in this response?
 * Only acknowledge milestones, and only sometimes for subtle ones
 *
 * @param {number|null} milestone - Milestone day or null
 * @param {number} streak - Current streak
 * @returns {boolean}
 */
function shouldAcknowledgeStreak(milestone, streak) {
    if (!milestone) return false;

    // Major milestones (30+) - always acknowledge
    if (milestone >= 30) return true;

    // Minor milestones (7, 14) - 50% chance
    return Math.random() < 0.5;
}

/**
 * Get casual "first message today" acknowledgments
 * Very subtle, Ika-style
 *
 * @returns {string}
 */
function getFirstMessageAck() {
    const messages = [
        "morning. you came back.",
        "hey. you're here.",
        "oh, there you are.",
        "back again.",
        "you showed up.",
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}

module.exports = {
    checkDaily,
    getMilestone,
    getStreakContext,
    getMilestoneMessage,
    shouldAcknowledgeStreak,
    getFirstMessageAck,
};
