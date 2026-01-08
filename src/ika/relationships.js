/**
 * Ika's Relationship System
 *
 * Manages how Ika's interactions differ based on relationship level.
 */

const { ikaMemoryOps, userOps } = require('../database');
const { getClient } = require('./presence');

// Relationship tier definitions
const RELATIONSHIP_TIERS = {
    stranger: {
        // No memory entry yet
        interactionStyle: 'polite',
        canReference: false,
        nicknameAllowed: false,
        vulnerabilityLevel: 'low',
    },
    new: {
        // Just started
        interactions: { min: 0, max: 10 },
        interactionStyle: 'welcoming',
        canReference: false,
        nicknameAllowed: false,
        vulnerabilityLevel: 'low',
    },
    familiar: {
        // Getting to know them
        interactions: { min: 10, max: 50 },
        interactionStyle: 'friendly',
        canReference: true,
        nicknameAllowed: false,
        vulnerabilityLevel: 'medium',
    },
    close: {
        // Good friends
        interactions: { min: 50, max: 100 },
        interactionStyle: 'casual',
        canReference: true,
        nicknameAllowed: true,
        vulnerabilityLevel: 'high',
    },
    devoted: {
        // Inner circle
        interactions: { min: 100, max: Infinity },
        interactionStyle: 'intimate',
        canReference: true,
        nicknameAllowed: true,
        vulnerabilityLevel: 'maximum',
    },
};

/**
 * Get relationship tier for a user
 */
function getRelationshipTier(userId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return 'stranger';
    return memory.relationship_level || 'new';
}

/**
 * Get tier configuration
 */
function getTierConfig(tier) {
    return RELATIONSHIP_TIERS[tier] || RELATIONSHIP_TIERS.new;
}

/**
 * Check if can reference journey for this user
 */
function canReferenceJourney(userId) {
    const tier = getRelationshipTier(userId);
    const config = getTierConfig(tier);
    return config.canReference;
}

/**
 * Check if can use/set nickname
 */
function canUseNickname(userId) {
    const tier = getRelationshipTier(userId);
    const config = getTierConfig(tier);
    return config.nicknameAllowed;
}

/**
 * Get vulnerability level for user
 */
function getVulnerabilityLevel(userId) {
    const tier = getRelationshipTier(userId);
    const config = getTierConfig(tier);
    return config.vulnerabilityLevel;
}

/**
 * Check if should send milestone DM
 */
async function checkMilestone(userId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    const milestones = [10, 50, 100];
    const count = memory.interaction_count;

    for (const milestone of milestones) {
        // Check if just crossed milestone
        if (count === milestone) {
            return milestone;
        }
    }

    return null;
}

/**
 * Send milestone notification if warranted
 * Skips silently if DMs closed (milestone messages are personal)
 */
async function notifyMilestoneIfNeeded(userId, newLevel) {
    if (!newLevel) return;

    const client = getClient();
    if (!client) return;

    try {
        const user = await client.users.fetch(userId);
        if (!user) return;

        const msgs = {
            familiar: "hey so... we've been talking a lot lately. i notice things. anyway.",
            close: "you know you're one of the people i actually look forward to seeing here right?",
            devoted: "so um. you've been here a lot. like, a lot a lot. i just wanted you to know i notice. and appreciate it.",
        };

        const message = msgs[newLevel];
        if (message) {
            await user.send(message);
        }
    } catch {
        // DMs closed - skip silently (milestone messages are personal)
    }
}

/**
 * Get all users at a specific relationship level
 */
function getUsersByLevel(level) {
    return ikaMemoryOps.getByRelationshipLevel(level);
}

/**
 * Get devoted users (for special interactions)
 */
function getDevotedUsers() {
    return ikaMemoryOps.getByRelationshipLevel('devoted');
}

/**
 * Get personalization instructions based on relationship
 */
function getPersonalizationInstructions(userId) {
    const tier = getRelationshipTier(userId);
    const memory = ikaMemoryOps.get(userId);

    const instructions = [];

    switch (tier) {
        case 'devoted':
            instructions.push('You know this person very well. Be warm and personal.');
            instructions.push('You can reference their journey, vow, or past conversations naturally.');
            if (memory?.nickname) {
                instructions.push(`You sometimes call them "${memory.nickname}".`);
            }
            instructions.push('You can be more vulnerable with them.');
            break;

        case 'close':
            instructions.push('You know this person fairly well. Be friendly and casual.');
            instructions.push('You can reference things you know about them.');
            break;

        case 'familiar':
            instructions.push('You recognize this person. Be warm but not overly familiar.');
            break;

        case 'new':
            instructions.push('This person is relatively new. Be welcoming.');
            break;

        default:
            instructions.push('Be friendly and welcoming.');
    }

    return instructions.join(' ');
}

/**
 * Special interaction chances based on relationship
 */
function getSpecialInteractionChance(userId, type) {
    const tier = getRelationshipTier(userId);

    const chances = {
        vow_callback: {
            stranger: 0,
            new: 0,
            familiar: 0.02,
            close: 0.05,
            devoted: 0.1,
        },
        nickname_use: {
            stranger: 0,
            new: 0,
            familiar: 0,
            close: 0.2,
            devoted: 0.4,
        },
        personal_checkin: {
            stranger: 0,
            new: 0.01,
            familiar: 0.03,
            close: 0.08,
            devoted: 0.15,
        },
    };

    return chances[type]?.[tier] || 0;
}

module.exports = {
    RELATIONSHIP_TIERS,
    getRelationshipTier,
    getTierConfig,
    canReferenceJourney,
    canUseNickname,
    getVulnerabilityLevel,
    checkMilestone,
    notifyMilestoneIfNeeded,
    getUsersByLevel,
    getDevotedUsers,
    getPersonalizationInstructions,
    getSpecialInteractionChance,
};
