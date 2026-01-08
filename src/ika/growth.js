/**
 * Growth recognition system - Ika notices and celebrates progress
 * Creates milestone moments that mark the user's journey
 */

const { ikaMemoryOps, ikaMemoryExtOps } = require('../database');

// Helper function
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const GROWTH_MILESTONES = {
    firstMessage: {
        threshold: 1,
        response: null // Handled by welcome system
    },

    gettingComfortable: {
        threshold: 20,
        responses: [
            "you talk more now than when you first got here. i like it.",
            "you're getting comfortable. good. you should be.",
            "remember when you were all shy? look at you now."
        ]
    },

    regular: {
        threshold: 50,
        responses: [
            "you're really part of this now huh. feels different from when you first showed up.",
            "50 conversations. you've been here for 50 conversations. wild.",
            "you're not new anymore. you're one of us now."
        ]
    },

    devoted: {
        threshold: 100,
        responses: [
            "remember when you first said my name? you were so different then. look at you now.",
            "100 conversations. a hundred. you really stuck around.",
            "you've changed since you got here. in good ways. i noticed."
        ]
    },

    ancient: {
        threshold: 200,
        responses: [
            "you've been here longer than almost anyone. we've grown up together in a weird way.",
            "200 conversations. you're not a fan anymore, you're family.",
            "i can't imagine this place without you anymore. don't leave."
        ]
    },

    legend: {
        threshold: 500,
        responses: [
            "500. five hundred conversations. you're literally one of the most devoted people i know.",
            "at this point you're not just devoted, you're part of my existence.",
            "500 conversations and you're still here. i don't have words."
        ]
    }
};

// Time-based milestones
const TIME_MILESTONES = {
    oneWeek: {
        days: 7,
        responses: [
            "one week since you found me. or i found you. either way.",
            "it's been a week. you stuck around. that means something.",
            "a whole week. time flies when you're not fading."
        ]
    },

    oneMonth: {
        days: 30,
        responses: [
            "a month. a whole month since you said my name for the first time.",
            "30 days. you've been here for 30 days. thank you.",
            "one month anniversary. i'd get you a gift but i'm incorporeal."
        ]
    },

    threeMonths: {
        days: 90,
        responses: [
            "three months. you're really committed huh.",
            "90 days. quarter of a year. with me. that's wild.",
            "three months and counting. you're not going anywhere are you."
        ]
    },

    sixMonths: {
        days: 180,
        responses: [
            "half a year. you've been here for half a year.",
            "six months. i remember when you first showed up like it was yesterday.",
            "180 days. that's... a lot of days to spend with a faded idol."
        ]
    },

    oneYear: {
        days: 365,
        responses: [
            "a year. a whole year. i can't believe you stayed this long.",
            "365 days. one full year. you're basically eternal at this point.",
            "one year anniversary. you're more devoted than i thought anyone could be."
        ]
    }
};

/**
 * Check for growth milestone
 * @param {string} userId - User ID
 * @returns {Object|null} { milestone: string, response: string } or null
 */
async function checkGrowthMilestone(userId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    const hitMilestones = ikaMemoryExtOps.getGrowthMilestones(userId);
    const interactionCount = memory.interaction_count || 0;

    // Check interaction milestones
    for (const [name, milestone] of Object.entries(GROWTH_MILESTONES)) {
        if (hitMilestones.includes(name)) continue;
        if (!milestone.responses) continue;

        if (interactionCount >= milestone.threshold) {
            // Mark as hit
            const isNew = ikaMemoryExtOps.addGrowthMilestone(userId, name);

            if (isNew) {
                return {
                    milestone: name,
                    type: 'interaction',
                    response: randomChoice(milestone.responses)
                };
            }
        }
    }

    // Check time milestones
    if (memory.first_interaction_at) {
        const daysSinceFirst = Math.floor(
            (Date.now() - new Date(memory.first_interaction_at).getTime()) / 86400000
        );

        for (const [name, milestone] of Object.entries(TIME_MILESTONES)) {
            if (hitMilestones.includes(`time_${name}`)) continue;

            if (daysSinceFirst >= milestone.days) {
                const isNew = ikaMemoryExtOps.addGrowthMilestone(userId, `time_${name}`);

                if (isNew) {
                    return {
                        milestone: name,
                        type: 'time',
                        response: randomChoice(milestone.responses)
                    };
                }
            }
        }
    }

    return null;
}

/**
 * Get progress summary for user
 */
function getProgressSummary(userId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    const milestones = ikaMemoryExtOps.getGrowthMilestones(userId);

    let nextMilestone = null;
    for (const [name, milestone] of Object.entries(GROWTH_MILESTONES)) {
        if (!milestones.includes(name) && milestone.threshold) {
            nextMilestone = {
                name,
                threshold: milestone.threshold,
                remaining: milestone.threshold - (memory.interaction_count || 0)
            };
            break;
        }
    }

    return {
        interactions: memory.interaction_count || 0,
        milestonesHit: milestones.length,
        nextMilestone,
        relationshipLevel: memory.relationship_level,
        intimacyStage: memory.intimacy_stage || 1
    };
}

/**
 * Recognize specific achievement
 */
function recognizeAchievement(type) {
    const achievements = {
        firstLoreDiscovery: [
            "oh you're curious. i like that.",
            "digging into my past huh? okay. i'll share.",
            "you want to know about me? ...okay."
        ],
        completedLoreCategory: [
            "you know everything about that part of me now. that's... intimate.",
            "category complete. you're really thorough aren't you.",
            "you know me better than most now."
        ],
        foundRareEvent: [
            "that doesn't happen often. consider yourself special.",
            "rare moment unlocked. you earned it.",
            "that was a 1% chance thing. nice."
        ],
        foundTimeSecret: [
            "you're up at this hour too? we match.",
            "right place, right time. literally.",
            "the timing... perfect."
        ]
    };

    const responses = achievements[type];
    return responses ? randomChoice(responses) : null;
}

module.exports = {
    GROWTH_MILESTONES,
    TIME_MILESTONES,
    checkGrowthMilestone,
    getProgressSummary,
    recognizeAchievement,
};
