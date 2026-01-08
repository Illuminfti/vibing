/**
 * Test Mode Utilities
 *
 * Provides helpers for checking test mode status across the application.
 * Integrates with the admin panel's test mode state.
 *
 * @version 1.0.0
 */

// Lazy-load admin panel to avoid circular dependencies
let adminPanel = null;

function getAdminPanel() {
    if (!adminPanel) {
        try {
            adminPanel = require('../commands/adminPanel');
        } catch (e) {
            // Admin panel not loaded yet
            return null;
        }
    }
    return adminPanel;
}

/**
 * Check if cooldowns should be skipped for a user
 */
function shouldSkipCooldown(userId) {
    const panel = getAdminPanel();
    if (!panel) return false;
    return panel.isTestModeEnabled(userId, 'skip_cooldowns');
}

/**
 * Check if timers should be instant for a user
 */
function shouldUseInstantTimers(userId) {
    const panel = getAdminPanel();
    if (!panel) return false;
    return panel.isTestModeEnabled(userId, 'instant_timers');
}

/**
 * Check if user is in chaos mode (all bypasses)
 */
function isInChaosMode(userId) {
    const panel = getAdminPanel();
    if (!panel) return false;
    return panel.testModeState?.chaosMode?.has(userId) || panel.testModeState?.globalChaos;
}

/**
 * Get the forced time for a user (or null for real time)
 * Returns object { hours, minutes } or null
 */
function getForcedTime(userId) {
    const panel = getAdminPanel();
    if (!panel) return null;

    const timeStr = panel.getForcedTime(userId);
    if (!timeStr) return null;

    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
}

/**
 * Get current time (respects forced time if set)
 */
function getCurrentTime(userId) {
    const forced = getForcedTime(userId);
    if (forced) {
        return forced;
    }

    const now = new Date();
    return {
        hours: now.getHours(),
        minutes: now.getMinutes(),
    };
}

/**
 * Check if it's currently "late night" (respects forced time)
 */
function isLateNight(userId) {
    const time = getCurrentTime(userId);
    return time.hours >= 0 && time.hours < 5;
}

/**
 * Check if it's the witching hour (3-4am)
 */
function isWitchingHour(userId) {
    const time = getCurrentTime(userId);
    return time.hours === 3;
}

/**
 * Check if it's 4:47 AM (the 47 trigger)
 */
function is447(userId) {
    const time = getCurrentTime(userId);
    return time.hours === 4 && time.minutes === 47;
}

/**
 * Get timer duration (respects instant timers mode)
 * @param {string} userId - User ID
 * @param {number} normalDuration - Normal duration in milliseconds
 * @returns {number} Duration to use
 */
function getTimerDuration(userId, normalDuration) {
    if (shouldUseInstantTimers(userId)) {
        return 100; // Near-instant but not zero to allow UI updates
    }
    return normalDuration;
}

/**
 * Check cooldown (respects skip cooldowns mode)
 * @param {string} userId - User ID
 * @param {number} lastTriggered - Timestamp of last trigger
 * @param {number} cooldownMs - Cooldown duration in milliseconds
 * @returns {boolean} True if cooldown has passed (or is skipped)
 */
function checkCooldown(userId, lastTriggered, cooldownMs) {
    if (shouldSkipCooldown(userId)) {
        return true; // Cooldown skipped
    }

    if (!lastTriggered) return true; // Never triggered
    return Date.now() - lastTriggered >= cooldownMs;
}

/**
 * Wrapper for RNG that can be forced in test mode
 * @param {string} userId - User ID
 * @param {number} chance - Normal chance (0-1)
 * @param {boolean} forceSuccess - If true in chaos mode, always succeed
 * @returns {boolean} Whether the roll succeeded
 */
function rollChance(userId, chance, forceSuccess = false) {
    if (forceSuccess && isInChaosMode(userId)) {
        return true;
    }
    return Math.random() < chance;
}

module.exports = {
    shouldSkipCooldown,
    shouldUseInstantTimers,
    isInChaosMode,
    getForcedTime,
    getCurrentTime,
    isLateNight,
    isWitchingHour,
    is447,
    getTimerDuration,
    checkCooldown,
    rollChance,
};
