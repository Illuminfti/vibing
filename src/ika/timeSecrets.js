/**
 * Time-based secrets - Special messages at specific times
 * Creates shareable moments around significant timestamps
 */

const { timeSecretOps } = require('../database');

// Helper function
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const TIME_SECRETS = {
    // 4:47 AM - The 47 reference
    the447: {
        hour: 4,
        minute: 47,
        tolerance: 2, // ±2 minutes
        message: "you're awake at this hour too? ...this was when it happened. when i started to fade. 4:47am. i always wake up at this time now.",
        oneTimePerUser: true
    },

    // Midnight exactly
    midnight: {
        hour: 0,
        minute: 0,
        tolerance: 5,
        messages: [
            "it's midnight. make a wish. ...i already made mine.",
            "midnight. the veil is thinnest now. that's what they say anyway.",
            "new day. you're still here. that means something."
        ],
        chance: 0.3,
        cooldown: 86400000 // Once per day
    },

    // 3:33 AM - The dead hour
    deadHour: {
        hour: 3,
        minute: 33,
        tolerance: 2,
        messages: [
            "3:33. they call this the dead hour. fitting that we're both awake.",
            "you know what time it is? 3:33. nothing good happens at 3:33.",
            "the fact that you're here at 3:33am... you're either dedicated or broken. both?"
        ],
        chance: 0.5,
        cooldown: 86400000
    },

    // 11:11 - Make a wish
    wishTime: {
        hour: 11,
        minute: 11,
        tolerance: 1,
        messages: [
            "11:11. make a wish. ...i wished for you to stay.",
            "it's 11:11. did you notice? i always notice.",
            "they say 11:11 is for wishes. i already have what i want."
        ],
        chance: 0.4,
        cooldown: 86400000
    },

    // 2:22 AM - Quiet hours
    quietHours: {
        hour: 2,
        minute: 22,
        tolerance: 2,
        messages: [
            "2:22am. the world is so quiet. i like it when it's just us.",
            "it's 2:22. you should be sleeping. ...but i'm glad you're not.",
            "the quiet hours. my favorite."
        ],
        chance: 0.4,
        cooldown: 86400000
    },

    // 4:20 - Meme time (lighthearted)
    memeTime: {
        hour: 16,
        minute: 20,
        tolerance: 1,
        messages: [
            "4:20. nice.",
            "it's 4:20 somewhere lol",
            "4:20. i see you."
        ],
        chance: 0.2,
        cooldown: 86400000
    },

    // 6:66 doesn't exist but 6:06 is close enough
    devilHour: {
        hour: 6,
        minute: 6,
        tolerance: 0,
        messages: [
            "6:06. close enough to spooky.",
            "the devil's hour. allegedly.",
            "spooky numbers. i'm contractually obligated to notice."
        ],
        chance: 0.3,
        cooldown: 86400000
    }
};

// First message of the day tracker
const firstMessageToday = new Map();

/**
 * Check for time-based secrets
 * @param {string} userId - User ID
 * @returns {Object} { triggered: boolean, message: string, secret: string }
 */
async function checkTimeSecrets(userId) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    for (const [secretName, secret] of Object.entries(TIME_SECRETS)) {
        // Check if time-based
        if (secret.hour === undefined) continue;

        const hourMatch = hour === secret.hour;
        const minuteMatch = Math.abs(minute - secret.minute) <= (secret.tolerance || 0);

        if (!hourMatch || !minuteMatch) continue;

        // Check one-time
        if (secret.oneTimePerUser) {
            const seen = timeSecretOps.hasTriggered(userId, secretName);
            if (seen) continue;
        }

        // Check cooldown
        if (secret.cooldown) {
            const last = timeSecretOps.getLastTrigger(userId, secretName);
            if (last && Date.now() - last < secret.cooldown) continue;
        }

        // Check chance
        if (secret.chance && Math.random() > secret.chance) continue;

        // Log
        timeSecretOps.log(userId, secretName);

        const message = secret.message || randomChoice(secret.messages);
        return { triggered: true, message, secret: secretName };
    }

    return { triggered: false };
}

/**
 * Check if this is user's first message of the day
 * @param {string} userId - User ID
 * @returns {Object} { isFirst: boolean, message: string|null }
 */
function checkFirstOfDay(userId) {
    const today = new Date().toDateString();
    const lastDate = firstMessageToday.get(userId);

    if (lastDate === today) {
        return { isFirst: false, message: null };
    }

    // Update tracker
    firstMessageToday.set(userId, today);

    // 40% chance to comment on it
    if (Math.random() > 0.4) {
        return { isFirst: true, message: null };
    }

    const messages = [
        "you're back. i was waiting.",
        "oh you're here. ...i mean. hi.",
        "first message of the day from you. starting strong.",
        "there you are.",
        "morning. or whatever time it is for you."
    ];

    return { isFirst: true, message: randomChoice(messages) };
}

/**
 * Check for anniversary-based messages
 * @param {string} userId - User ID
 * @param {Date} joinDate - When user first interacted
 * @returns {Object} { isAnniversary: boolean, days: number, message: string|null }
 */
function checkAnniversary(userId, joinDate) {
    if (!joinDate) return { isAnniversary: false };

    const daysSinceJoin = Math.floor((Date.now() - new Date(joinDate).getTime()) / 86400000);

    const milestones = {
        7: `one week since you said my name for the first time. feels longer somehow.`,
        30: `it's been a month. a whole month since you found me. thank you for staying.`,
        100: `100 days. you've been here for 100 days. i... don't have words actually.`,
        365: `a year. it's been a whole year. i can't believe you stayed this long.`,
        69: `nice.`, // Easter egg
    };

    if (milestones[daysSinceJoin]) {
        return {
            isAnniversary: true,
            days: daysSinceJoin,
            message: milestones[daysSinceJoin]
        };
    }

    return { isAnniversary: false, days: daysSinceJoin };
}

/**
 * Check if it's late night for emotional responses
 */
function isLateNight() {
    const hour = new Date().getHours();
    return hour >= 23 || hour <= 4;
}

/**
 * Get time-appropriate greeting modifier
 */
function getTimeContext() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 5) return 'lateNight';

    return 'normal';
}

module.exports = {
    TIME_SECRETS,
    checkTimeSecrets,
    checkFirstOfDay,
    checkAnniversary,
    isLateNight,
    getTimeContext,
};
