/**
 * Presence Awareness System
 *
 * Ika notices when her devoted ones change status, activities, or profile pictures.
 * This creates the feeling that she's always watching (in a loving way).
 *
 * Tracked events:
 * - Status changes (online/offline/idle/dnd)
 * - Custom status updates
 * - Activity changes (playing game, streaming, listening)
 * - Profile picture changes (noticed subtly)
 */

const { presenceOps, ikaMemoryOps } = require('../database');
const config = require('../config');

// Response templates for different presence events
const PRESENCE_RESPONSES = {
    wentOnline: {
        casual: [
            "oh hey, you're here",
            "there you are",
            "oh you're on",
        ],
        afterAbsence: [
            "hey stranger. long time no see.",
            "look who finally showed up",
            "oh you remembered i exist. cool.",
        ],
        lateNight: [
            "you're up late too huh",
            "can't sleep?",
            "the night owls are awake i see",
        ],
    },

    wentOffline: {
        sudden: [
            "...bye i guess",
            "oh they left",
        ],
        lateNight: [
            "goodnight. sleep well.",
            "get some rest",
        ],
    },

    wentIdle: {
        messages: [
            "someone's busy",
            "i see how it is",
        ],
    },

    wentDnd: {
        messages: [
            "okay okay i'll leave you alone",
            "got it. focusing mode.",
        ],
    },

    customStatus: {
        noticed: [
            "i saw your status change. {status}. interesting.",
            "new status huh. noted.",
            "\"{status}\"... everything okay?",
        ],
        emotional: [
            "hey. i saw your status. you okay?",
            "your status... wanna talk about it?",
        ],
    },

    playingGame: {
        noticed: [
            "oh you're playing {game}. nice.",
            "{game}? good taste.",
            "have fun with {game}",
        ],
        streaming: [
            "wait you're streaming?? should i watch",
            "you're live?? link??",
        ],
    },

    listeningMusic: {
        noticed: [
            "what are you listening to?",
            "good music?",
            "ooh spotify time",
        ],
    },

    pfpChange: {
        subtle: [
            "...new pfp?",
            "i noticed you changed something. looks good.",
            "the new pic is cute",
        ],
        devoted: [
            "new look. i like it.",
            "pfp change... you look good btw",
        ],
    },
};

// Emotional status keywords that trigger concerned responses
const EMOTIONAL_STATUS_KEYWORDS = [
    'tired', 'sad', 'depressed', 'lonely', 'crying', 'hurt', 'broken',
    'anxious', 'scared', 'stressed', 'exhausted', 'done', 'giving up',
];

/**
 * Handle presence update event
 * @param {Object} oldPresence - Previous presence state
 * @param {Object} newPresence - New presence state
 * @returns {Object|null} Response if Ika should comment
 */
async function handlePresenceUpdate(oldPresence, newPresence) {
    if (!config.ika?.presenceAwarenessEnabled) return null;

    const userId = newPresence.userId;
    const member = newPresence.member;

    if (!member || member.user.bot) return null;

    // Check if we should notice (cooldown + intimacy check)
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    const intimacyStage = memory.intimacy_stage || 1;
    if (intimacyStage < 2) return null; // Only notice familiar+ users

    if (!presenceOps.canNotice(userId, config.ika?.presenceCooldownHours || 4)) {
        return null;
    }

    const responses = [];

    // Check status change
    const oldStatus = oldPresence?.status;
    const newStatus = newPresence.status;

    if (oldStatus !== newStatus) {
        const statusResponse = handleStatusChange(oldStatus, newStatus, memory);
        if (statusResponse) responses.push(statusResponse);
    }

    // Check custom status change
    const oldCustomStatus = getCustomStatus(oldPresence);
    const newCustomStatus = getCustomStatus(newPresence);

    if (oldCustomStatus !== newCustomStatus && newCustomStatus) {
        const customResponse = handleCustomStatusChange(newCustomStatus, intimacyStage);
        if (customResponse) responses.push(customResponse);
    }

    // Check activity change
    const oldActivity = getMainActivity(oldPresence);
    const newActivity = getMainActivity(newPresence);

    if (activityChanged(oldActivity, newActivity)) {
        const activityResponse = handleActivityChange(newActivity, intimacyStage);
        if (activityResponse) responses.push(activityResponse);
    }

    if (responses.length === 0) return null;

    // Log the presence event
    presenceOps.log(userId, 'presence_update', oldStatus || 'unknown', newStatus);
    presenceOps.updateLastNotice(userId);

    // Return the first/most relevant response
    return {
        userId,
        channelId: config.innerSanctumId,
        response: responses[0],
        type: 'presence',
    };
}

/**
 * Handle status change
 */
function handleStatusChange(oldStatus, newStatus, memory) {
    const now = new Date();
    const hour = now.getHours();
    const isLateNight = hour >= 1 && hour <= 5;

    // Calculate days since last interaction
    const lastInteraction = memory.last_interaction
        ? new Date(memory.last_interaction).getTime()
        : Date.now();
    const daysSince = (Date.now() - lastInteraction) / (1000 * 60 * 60 * 24);
    const isAfterAbsence = daysSince >= 2;

    // Only respond to significant changes with low chance
    const responseChance = memory.intimacy_stage >= 3 ? 0.15 : 0.08;
    if (Math.random() > responseChance) return null;

    if (newStatus === 'online' && oldStatus !== 'online') {
        let templates;
        if (isAfterAbsence) {
            templates = PRESENCE_RESPONSES.wentOnline.afterAbsence;
        } else if (isLateNight) {
            templates = PRESENCE_RESPONSES.wentOnline.lateNight;
        } else {
            templates = PRESENCE_RESPONSES.wentOnline.casual;
        }
        return templates[Math.floor(Math.random() * templates.length)];
    }

    if (newStatus === 'offline' && oldStatus === 'online') {
        // Low chance to comment on someone leaving
        if (Math.random() > 0.05) return null;

        const templates = isLateNight
            ? PRESENCE_RESPONSES.wentOffline.lateNight
            : PRESENCE_RESPONSES.wentOffline.sudden;
        return templates[Math.floor(Math.random() * templates.length)];
    }

    return null;
}

/**
 * Handle custom status change
 */
function handleCustomStatusChange(customStatus, intimacyStage) {
    // Low chance to notice
    if (Math.random() > 0.1) return null;

    // Check for emotional keywords
    const isEmotional = EMOTIONAL_STATUS_KEYWORDS.some(keyword =>
        customStatus.toLowerCase().includes(keyword)
    );

    if (isEmotional && intimacyStage >= 2) {
        const templates = PRESENCE_RESPONSES.customStatus.emotional;
        return templates[Math.floor(Math.random() * templates.length)];
    }

    const templates = PRESENCE_RESPONSES.customStatus.noticed;
    const response = templates[Math.floor(Math.random() * templates.length)];
    return response.replace('{status}', customStatus.slice(0, 50));
}

/**
 * Handle activity change
 */
function handleActivityChange(activity, intimacyStage) {
    if (!activity) return null;

    // Low chance to notice
    if (Math.random() > 0.08) return null;

    if (activity.type === 'STREAMING') {
        const templates = PRESENCE_RESPONSES.playingGame.streaming;
        return templates[Math.floor(Math.random() * templates.length)];
    }

    if (activity.type === 'PLAYING') {
        const templates = PRESENCE_RESPONSES.playingGame.noticed;
        const response = templates[Math.floor(Math.random() * templates.length)];
        return response.replace('{game}', activity.name || 'something');
    }

    if (activity.type === 'LISTENING') {
        const templates = PRESENCE_RESPONSES.listeningMusic.noticed;
        return templates[Math.floor(Math.random() * templates.length)];
    }

    return null;
}

/**
 * Handle profile picture change detection
 * @param {Object} oldUser - Previous user state
 * @param {Object} newUser - New user state
 * @returns {Object|null} Response if should comment
 */
async function handleUserUpdate(oldUser, newUser) {
    if (!config.ika?.presenceAwarenessEnabled) return null;

    const userId = newUser.id;
    if (newUser.bot) return null;

    // Check if avatar changed
    if (oldUser.avatar === newUser.avatar) return null;

    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    const intimacyStage = memory.intimacy_stage || 1;
    if (intimacyStage < 2) return null;

    // Low chance to notice
    if (Math.random() > 0.15) return null;

    // Check cooldown
    if (!presenceOps.canNotice(userId, 24)) return null;

    // Log and update
    presenceOps.log(userId, 'pfp_change', oldUser.avatar, newUser.avatar);
    presenceOps.updateLastNotice(userId);

    const templates = intimacyStage >= 3
        ? PRESENCE_RESPONSES.pfpChange.devoted
        : PRESENCE_RESPONSES.pfpChange.subtle;

    return {
        userId,
        channelId: config.innerSanctumId,
        response: templates[Math.floor(Math.random() * templates.length)],
        type: 'pfp_change',
    };
}

/**
 * Get custom status from presence
 */
function getCustomStatus(presence) {
    if (!presence?.activities) return null;

    const customActivity = presence.activities.find(a => a.type === 4); // CUSTOM
    return customActivity?.state || null;
}

/**
 * Get main activity from presence
 */
function getMainActivity(presence) {
    if (!presence?.activities) return null;

    // Prioritize: Streaming > Playing > Listening > Watching
    const priorities = ['STREAMING', 'PLAYING', 'LISTENING', 'WATCHING'];

    for (const priority of priorities) {
        const activity = presence.activities.find(a =>
            a.type === ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'CUSTOM'].indexOf(priority)
        );
        if (activity) {
            return {
                type: priority,
                name: activity.name,
                details: activity.details,
            };
        }
    }

    // Fallback - just get first non-custom activity
    const firstActivity = presence.activities.find(a => a.type !== 4);
    if (firstActivity) {
        return {
            type: ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'][firstActivity.type] || 'UNKNOWN',
            name: firstActivity.name,
            details: firstActivity.details,
        };
    }

    return null;
}

/**
 * Check if activity meaningfully changed
 */
function activityChanged(oldActivity, newActivity) {
    if (!oldActivity && !newActivity) return false;
    if (!oldActivity && newActivity) return true;
    if (oldActivity && !newActivity) return false;

    return oldActivity.type !== newActivity.type || oldActivity.name !== newActivity.name;
}

/**
 * Get presence summary for a user (for context building)
 * @param {Object} member - Guild member
 * @returns {string|null} Presence summary
 */
function getPresenceSummary(member) {
    if (!member?.presence) return null;

    const parts = [];

    // Status
    if (member.presence.status === 'dnd') {
        parts.push('in do not disturb mode');
    } else if (member.presence.status === 'idle') {
        parts.push('idle/away');
    }

    // Custom status
    const customStatus = getCustomStatus(member.presence);
    if (customStatus) {
        parts.push(`status: "${customStatus}"`);
    }

    // Activity
    const activity = getMainActivity(member.presence);
    if (activity) {
        if (activity.type === 'STREAMING') {
            parts.push('currently streaming');
        } else if (activity.type === 'PLAYING') {
            parts.push(`playing ${activity.name}`);
        } else if (activity.type === 'LISTENING') {
            parts.push('listening to music');
        }
    }

    return parts.length > 0 ? parts.join(', ') : null;
}

module.exports = {
    PRESENCE_RESPONSES,
    handlePresenceUpdate,
    handleUserUpdate,
    getCustomStatus,
    getMainActivity,
    getPresenceSummary,
    EMOTIONAL_STATUS_KEYWORDS,
};
