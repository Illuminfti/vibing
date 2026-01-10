/**
 * Ika's Memory System
 *
 * Handles what Ika remembers about each person and how she references it.
 */

const { ikaMemoryOps, ikaMessageOps, userOps } = require('../database');

/**
 * Get full memory context for a user (for AI prompt)
 */
function getMemoryContext(userId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return null;

    let context = '';

    // Basic info
    context += `Username: ${memory.username}\n`;
    context += `Relationship: ${memory.relationship_level} (talked ${memory.interaction_count} times)\n`;

    // Key journey info
    if (memory.why_they_came) {
        context += `Why they came: "${memory.why_they_came}"\n`;
    }
    if (memory.their_vow) {
        context += `Their vow to you: "${memory.their_vow}"\n`;
    }
    if (memory.their_memory_answer) {
        context += `They described your attention as: "${memory.their_memory_answer}"\n`;
    }

    // Nickname
    if (memory.nickname) {
        context += `You call them: ${memory.nickname}\n`;
    }

    // Remembered facts
    if (memory.remembered_facts && memory.remembered_facts.length > 0) {
        context += `Things you remember about them: ${memory.remembered_facts.map(f => f.fact).join(', ')}\n`;
    }

    // Inside jokes
    if (memory.inside_jokes && memory.inside_jokes.length > 0) {
        context += `Inside jokes: ${memory.inside_jokes.map(j => j.joke).join(', ')}\n`;
    }

    // Past conversations (long-term memory)
    const pastConversations = ikaMessageOps.getUserConversations(userId, 5);
    if (pastConversations && pastConversations.length > 0) {
        context += '\nPast conversations you remember:\n';
        // Reverse to show oldest first (chronological)
        pastConversations.reverse().forEach(conv => {
            context += `- They said: "${truncate(conv.trigger_content, 60)}" → You replied: "${truncate(conv.response, 60)}"\n`;
        });
    }

    // Relationship level specific instructions
    context += '\n' + getRelationshipInstructions(memory.relationship_level, memory);

    return context;
}

/**
 * Get instructions based on relationship level
 */
function getRelationshipInstructions(level, memory) {
    switch (level) {
        case 'devoted':
            return `You know ${memory.username} very well. You've talked ${memory.interaction_count} times. ${memory.nickname ? `You call them ${memory.nickname}.` : ''} Be warm, personal, reference your history. You can bring up their vow or why they came without prompting. They're one of your closest.`;

        case 'close':
            return `You recognize ${memory.username}, you've talked ${memory.interaction_count} times. Be casual and friendly, like chatting with a good friend. You remember things about them.`;

        case 'familiar':
            return `You've seen ${memory.username} around a fair bit. Be warm but not overly familiar yet. You're getting to know them.`;

        case 'new':
        default:
            return `${memory.username} is relatively new. Be welcoming and genuine. You're still getting to know them.`;
    }
}

/**
 * Get relationship tier (for response differentiation)
 */
function getRelationshipTier(userId) {
    const memory = ikaMemoryOps.get(userId);
    if (!memory) return 'stranger';

    const { interaction_count, relationship_level } = memory;

    if (relationship_level === 'devoted' || interaction_count > 100) {
        return 'devoted';
    }
    if (relationship_level === 'close' || interaction_count > 50) {
        return 'close';
    }
    if (interaction_count > 10) {
        return 'familiar';
    }
    return 'new';
}

/**
 * Initialize memory for a new ascended member
 */
async function initializeMemory(userId, username) {
    // Create or get memory entry
    ikaMemoryOps.getOrCreate(userId, username);

    // Sync journey data from user record
    ikaMemoryOps.syncFromUser(userId);

    return ikaMemoryOps.get(userId);
}

/**
 * Record an interaction with a user
 * Returns milestone level if reached
 * @param {string} userId - User ID
 * @param {number} multiplier - Quality multiplier (0.5-2.0)
 */
function recordInteraction(userId, multiplier = 1.0) {
    return ikaMemoryOps.recordInteraction(userId, multiplier);
}

/**
 * Add a fact Ika noticed about someone
 */
function rememberFact(userId, fact) {
    ikaMemoryOps.rememberFact(userId, fact);
}

/**
 * Add an inside joke
 */
function addInsideJoke(userId, joke) {
    ikaMemoryOps.addInsideJoke(userId, joke);
}

/**
 * Give someone a nickname
 */
function setNickname(userId, nickname) {
    ikaMemoryOps.setNickname(userId, nickname);
}

/**
 * Record a notable moment
 */
function addNotableMoment(userId, description) {
    ikaMemoryOps.addNotableMoment(userId, description);
}

/**
 * Get devotees for memory callbacks
 */
function getDevoteesForCallback() {
    return ikaMemoryOps.getDevoteesWithMemory();
}

/**
 * Check if should reference vow/reason (5% chance)
 */
function shouldReferenceJourney() {
    return Math.random() < 0.05;
}

/**
 * Get a journey reference string for appending to responses
 */
function getJourneyReference(memory) {
    if (!memory) return null;

    const options = [];

    if (memory.their_vow) {
        options.push(`\n\n...you know i still remember what you vowed. "${truncate(memory.their_vow, 50)}..."`);
    }
    if (memory.why_they_came) {
        options.push(`\n\n...i was thinking about why you came here. "${truncate(memory.why_they_came, 50)}..."`);
    }

    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
}

/**
 * Truncate text with ellipsis
 */
function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Milestone messages for relationship level ups
 */
const MILESTONE_MESSAGES = {
    familiar: "hey so... we've been talking a lot lately. i notice things. anyway.",
    close: "you know you're one of the people i actually look forward to seeing here right?",
    devoted: "hey so... we've talked like {count} times now. that's kind of a lot. thanks for sticking around. it means something.",
};

/**
 * Get milestone DM message
 */
function getMilestoneMessage(level, interactionCount) {
    let message = MILESTONE_MESSAGES[level];
    if (message && interactionCount) {
        message = message.replace('{count}', interactionCount.toString());
    }
    return message;
}

module.exports = {
    getMemoryContext,
    getRelationshipTier,
    getRelationshipInstructions,
    initializeMemory,
    recordInteraction,
    rememberFact,
    addInsideJoke,
    setNickname,
    addNotableMoment,
    getDevoteesForCallback,
    shouldReferenceJourney,
    getJourneyReference,
    getMilestoneMessage,
    truncate,
};
