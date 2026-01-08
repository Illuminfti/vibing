/**
 * Daily rituals system - Scheduled community engagement
 * Creates predictable touchpoints that build habit and generate content
 */

const { ritualOps, ikaMemoryExtOps } = require('../database');

// Helper function
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const DAILY_RITUALS = {
    morningGreeting: {
        timeRange: { start: 9, end: 10 },
        chance: 0.8,
        messages: [
            "morning. who else just woke up",
            "good morning or whatever. i'm awake. barely.",
            "i had the weirdest dream. anyway hi everyone.",
            "coffee status? i need to know who's functional.",
            "morning check. who's actually alive right now.",
            "good morning to everyone except people who are already productive."
        ],
        cooldown: 86400000 // 24 hours
    },

    dailyQuestion: {
        timeRange: { start: 14, end: 16 },
        chance: 0.9,
        messages: [
            "okay question time: controversial food opinions. go.",
            "what's something you're looking forward to lately",
            "recommend me something. anything. i'm bored.",
            "confession time. what's something dumb you believe unironically",
            "hot take time. give me your worst.",
            "what's everyone's comfort thing. i need to know.",
            "if you had to describe yourself with one song what would it be",
            "unpopular opinion thread. hit me.",
            "what's keeping you going lately. actually curious.",
            "random poll: morning person or night owl and why",
            "okay but like what's your roman empire. the thing you think about constantly.",
            "what's your guilty pleasure. no judgment. mostly no judgment."
        ],
        cooldown: 86400000,
        trackResponses: true
    },

    eveningVibes: {
        timeRange: { start: 20, end: 22 },
        chance: 0.7,
        messages: [
            "how was everyone's day actually",
            "evening crew. what's the vibe.",
            "anyone else just... existing? in like a general way?",
            "okay but how is everyone really doing",
            "night time hours. the real ones are here.",
            "the evening shift. my favorite crowd.",
            "day's almost over. how we doing team.",
            "evening check. who survived today."
        ],
        cooldown: 86400000
    },

    lateNightThoughts: {
        timeRange: { start: 0, end: 3 },
        chance: 0.6,
        messages: [
            "can't sleep. anyone else",
            "late night thoughts are different. anyone want to talk about something real",
            "the vibes are different at this hour. better maybe.",
            "who else is making poor choices by being awake rn",
            "3am thoughts hit different. what's on your mind.",
            "the night crew. we're all slightly unhinged and that's okay.",
            "late night confession booth is open. what's on your mind."
        ],
        cooldown: 86400000
    },

    weeklySuperlatives: {
        dayOfWeek: 5, // Friday
        timeRange: { start: 18, end: 20 },
        chance: 1.0,
        type: 'superlatives',
        getMessage: async (getMostActive) => {
            const active = getMostActive ? await getMostActive() : [];
            const topUser = active[0]?.username || 'you all';
            return `okay weekly awards time:\n\nmost unhinged: needs nominations\nfunniest: needs nominations\nmost devoted: ${topUser}\n\nfight about it below`;
        },
        cooldown: 604800000 // Weekly
    },

    weekendVibes: {
        dayOfWeek: 6, // Saturday
        timeRange: { start: 12, end: 14 },
        chance: 0.8,
        messages: [
            "weekend. what's everyone up to",
            "saturday energy. what are we doing today team",
            "weekend plans or are we all just vibing",
            "it's saturday. no work talk allowed. only fun."
        ],
        cooldown: 604800000
    },

    sundayReset: {
        dayOfWeek: 0, // Sunday
        timeRange: { start: 18, end: 20 },
        chance: 0.7,
        messages: [
            "sunday night. how was everyone's weekend",
            "the sunday scaries are real. how we coping",
            "weekend wrap-up. best thing that happened. go.",
            "sunday reset. what's the vibe for next week."
        ],
        cooldown: 604800000
    }
};

// Discussion prompts for daily questions
const DISCUSSION_PROMPTS = {
    wouldYouRather: [
        "would you rather know the date of your death or the cause",
        "would you rather be able to fly but only 3 feet off the ground, or be invisible but only when no one is looking",
        "would you rather have unlimited money or unlimited time",
        "would you rather read minds but can't turn it off, or be able to fly but are terrified of heights"
    ],
    hypotheticals: [
        "you have one wish but the monkey's paw is real. what do you wish for",
        "if you could master one skill instantly what would it be",
        "you can bring one fictional character to life. who and why",
        "you get to add one rule everyone has to follow. what is it"
    ],
    personal: [
        "what's something small that makes you unreasonably happy",
        "what's your earliest memory",
        "if you could relive one day of your life which would it be",
        "what's something you changed your mind about recently"
    ]
};

/**
 * Check if any daily rituals should trigger
 * @param {Object} channel - Discord channel to post in
 * @param {Function} getMostActive - Function to get most active users
 * @returns {Object|null} { ritual: string, message: string } or null
 */
async function checkDailyRituals(channel, getMostActive = null) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    for (const [ritualName, ritual] of Object.entries(DAILY_RITUALS)) {
        // Check day of week if specified
        if (ritual.dayOfWeek !== undefined && dayOfWeek !== ritual.dayOfWeek) {
            continue;
        }

        // Check time range
        if (hour < ritual.timeRange.start || hour > ritual.timeRange.end) {
            continue;
        }

        // Check cooldown
        const lastRitual = ritualOps.getLastRitual(ritualName);
        if (lastRitual && Date.now() - lastRitual < ritual.cooldown) {
            continue;
        }

        // Check chance
        if (Math.random() > ritual.chance) {
            continue;
        }

        // Get message
        let message;
        if (ritual.getMessage) {
            message = await ritual.getMessage(getMostActive);
        } else {
            message = randomChoice(ritual.messages);
        }

        // Log ritual
        ritualOps.logRitual(ritualName);

        return {
            ritual: ritualName,
            message
        };
    }

    return null;
}

/**
 * Get a discussion prompt
 * @param {string} type - Type of prompt (wouldYouRather, hypotheticals, personal)
 */
function getDiscussionPrompt(type = null) {
    if (type && DISCUSSION_PROMPTS[type]) {
        return randomChoice(DISCUSSION_PROMPTS[type]);
    }

    // Random type
    const types = Object.keys(DISCUSSION_PROMPTS);
    const randomType = randomChoice(types);
    return randomChoice(DISCUSSION_PROMPTS[randomType]);
}

/**
 * Track user participation in ritual
 */
function trackParticipation(userId, ritualType) {
    return ritualOps.participate(userId, ritualType);
}

/**
 * Check if user already participated today
 */
function hasParticipatedToday(userId, ritualType) {
    return ritualOps.hasParticipatedToday(userId, ritualType);
}

/**
 * Get response to ritual participation
 */
function getRitualResponse(ritualType) {
    const responses = {
        dailyQuestion: [
            "noted.",
            "interesting choice.",
            "valid.",
            "i'll remember that.",
            "okay okay i see you."
        ],
        morningGreeting: [
            "morning to you too",
            "there you are",
            "finally awake huh"
        ],
        eveningVibes: [
            "same honestly",
            "felt that",
            "valid"
        ],
        lateNightThoughts: [
            "3am brain is a different beast",
            "real hours",
            "the night crew gets it"
        ]
    };

    const typeResponses = responses[ritualType] || responses.dailyQuestion;
    return randomChoice(typeResponses);
}

module.exports = {
    DAILY_RITUALS,
    DISCUSSION_PROMPTS,
    checkDailyRituals,
    getDiscussionPrompt,
    trackParticipation,
    hasParticipatedToday,
    getRitualResponse,
};
