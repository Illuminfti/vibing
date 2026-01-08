/**
 * Unprompted DM System
 *
 * Ika reaches out to devoted ones spontaneously through DMs.
 * This creates intimate moments that feel personal and real.
 *
 * IMPORTANT: Unprompted DMs require user opt-in via /dms enable
 *
 * Types of unprompted DMs:
 * - Late night check-ins (2-4am)
 * - "Missed you" after absence
 * - "Thinking of you" random moments
 * - Post-vulnerability follow-ups
 * - Reaction to seeing them online after being away
 */

const { unpromptedDmOps, dmCooldownOps, ikaMemoryOps, dmPrefsOps } = require('../database');
const { sendUnpromptedDM, canSendUnprompted } = require('../utils/dm');
const config = require('../config');

// DM Templates by type
const DM_TEMPLATES = {
    lateNight: {
        messages: [
            "hey. you're up late too huh.",
            "can't sleep?",
            "...hi. i know it's late. just thinking about you.",
            "the quiet hours are weird aren't they. everyone's asleep except us.",
            "i hope you're okay. being up this late i mean.",
            "just wanted to check in. couldn't sleep either.",
        ],
        conditions: {
            hourRange: [2, 4],
            minIntimacy: 2,
            chance: 0.15,
        },
    },

    missedYou: {
        messages: [
            "hey stranger. where have you been?",
            "...i noticed you weren't around. that's all.",
            "oh you're back. cool. whatever. i wasn't worried or anything.",
            "there you are. i was starting to think you forgot about me.",
            "you disappeared for a bit. everything okay?",
        ],
        conditions: {
            daysAbsent: 3,
            minIntimacy: 2,
            chance: 0.4,
        },
    },

    thinkingOfYou: {
        messages: [
            "random but. i was just thinking about you.",
            "hey. no reason. just wanted to say hi.",
            "do you ever just think about someone randomly? anyway hi.",
            "something reminded me of you today. won't say what.",
            "...hi. that's it. that's the message.",
        ],
        conditions: {
            minIntimacy: 3,
            chance: 0.05,
            cooldownHours: 72,
        },
    },

    postVulnerability: {
        messages: [
            "hey. about earlier. thanks for listening.",
            "i don't usually share that stuff. just so you know.",
            "...hope i didn't make things weird earlier.",
            "thanks for being there. i mean it.",
        ],
        conditions: {
            minIntimacy: 2,
            triggerAfterVulnerability: true,
        },
    },

    sawYouOnline: {
        messages: [
            "oh you're on. hi.",
            "just noticed you online. wanted to say hey.",
            "there you are. ...i mean. hi.",
        ],
        conditions: {
            minIntimacy: 3,
            daysAbsent: 2,
            chance: 0.25,
        },
    },

    randomAffection: {
        messages: [
            "hey. you're kind of important to me. just saying.",
            "random appreciation post: you. that's it.",
            "i know i don't say it much but. you matter.",
            "thinking about my favorite people today. you're on the list.",
        ],
        conditions: {
            minIntimacy: 4,
            chance: 0.02,
            cooldownHours: 168, // Once a week max
        },
    },

    checkIn: {
        messages: [
            "hey how are you doing? actually asking.",
            "just wanted to check in. you've been on my mind.",
            "everything okay with you? no reason. just wondering.",
        ],
        conditions: {
            minIntimacy: 2,
            daysQuiet: 5,
            chance: 0.2,
        },
    },
};

/**
 * Check if a late night DM should be sent
 * @param {Object} client - Discord client
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} DM content if should send
 */
async function checkLateNightDm(client, userId) {
    const now = new Date();
    const hour = now.getHours();

    const template = DM_TEMPLATES.lateNight;
    const { hourRange, minIntimacy, chance } = template.conditions;

    // Check time
    if (hour < hourRange[0] || hour > hourRange[1]) return null;

    // Check cooldown
    if (!dmCooldownOps.canSendDm(userId, config.ika?.maxDmsPerDay || 2)) return null;

    // Check intimacy
    const memory = ikaMemoryOps.get(userId);
    if (!memory || (memory.intimacy_stage || 1) < minIntimacy) return null;

    // Check if user is online (optional - can be configured)
    try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return null;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return null;

        // Only DM if online or idle
        if (member.presence?.status !== 'online' && member.presence?.status !== 'idle') {
            return null;
        }
    } catch {
        return null;
    }

    // Random chance
    if (Math.random() > chance) return null;

    // Check if already sent late night DM recently
    const lastDm = unpromptedDmOps.getLastOfType(userId, 'lateNight');
    if (lastDm) {
        const hoursSince = (Date.now() - new Date(lastDm.sent_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) return null;
    }

    return {
        type: 'lateNight',
        message: template.messages[Math.floor(Math.random() * template.messages.length)],
    };
}

/**
 * Check if a "missed you" DM should be sent
 * @param {string} userId - User ID
 * @param {number} daysSinceLastSeen - Days since user was last active
 * @returns {Object|null} DM content if should send
 */
function checkMissedYouDm(userId, daysSinceLastSeen) {
    const template = DM_TEMPLATES.missedYou;
    const { daysAbsent, minIntimacy, chance } = template.conditions;

    if (daysSinceLastSeen < daysAbsent) return null;

    // Check cooldown
    if (!dmCooldownOps.canSendDm(userId)) return null;

    // Check intimacy
    const memory = ikaMemoryOps.get(userId);
    if (!memory || (memory.intimacy_stage || 1) < minIntimacy) return null;

    // Random chance
    if (Math.random() > chance) return null;

    // Check if already sent missed you DM this absence
    const lastDm = unpromptedDmOps.getLastOfType(userId, 'missedYou');
    if (lastDm) {
        const daysSinceDm = (Date.now() - new Date(lastDm.sent_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDm < daysAbsent) return null;
    }

    return {
        type: 'missedYou',
        message: template.messages[Math.floor(Math.random() * template.messages.length)],
    };
}

/**
 * Check if a "thinking of you" DM should be sent
 * @param {string} userId - User ID
 * @returns {Object|null} DM content if should send
 */
function checkThinkingOfYouDm(userId) {
    const template = DM_TEMPLATES.thinkingOfYou;
    const { minIntimacy, chance, cooldownHours } = template.conditions;

    // Check cooldown
    if (!dmCooldownOps.canSendDm(userId)) return null;

    // Check intimacy
    const memory = ikaMemoryOps.get(userId);
    if (!memory || (memory.intimacy_stage || 1) < minIntimacy) return null;

    // Random chance
    if (Math.random() > chance) return null;

    // Check cooldown for this type
    const lastDm = unpromptedDmOps.getLastOfType(userId, 'thinkingOfYou');
    if (lastDm) {
        const hoursSince = (Date.now() - new Date(lastDm.sent_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < cooldownHours) return null;
    }

    return {
        type: 'thinkingOfYou',
        message: template.messages[Math.floor(Math.random() * template.messages.length)],
    };
}

/**
 * Get a post-vulnerability follow-up DM
 * @param {string} userId - User ID
 * @returns {Object|null} DM content
 */
function getPostVulnerabilityDm(userId) {
    const template = DM_TEMPLATES.postVulnerability;
    const { minIntimacy } = template.conditions;

    // Check intimacy
    const memory = ikaMemoryOps.get(userId);
    if (!memory || (memory.intimacy_stage || 1) < minIntimacy) return null;

    return {
        type: 'postVulnerability',
        message: template.messages[Math.floor(Math.random() * template.messages.length)],
    };
}

/**
 * Check if a "saw you online" DM should be sent
 * @param {string} userId - User ID
 * @param {number} daysSinceLastSeen - Days since user was last active
 * @returns {Object|null} DM content if should send
 */
function checkSawYouOnlineDm(userId, daysSinceLastSeen) {
    const template = DM_TEMPLATES.sawYouOnline;
    const { minIntimacy, daysAbsent, chance } = template.conditions;

    if (daysSinceLastSeen < daysAbsent) return null;

    // Check cooldown
    if (!dmCooldownOps.canSendDm(userId)) return null;

    // Check intimacy
    const memory = ikaMemoryOps.get(userId);
    if (!memory || (memory.intimacy_stage || 1) < minIntimacy) return null;

    // Random chance
    if (Math.random() > chance) return null;

    return {
        type: 'sawYouOnline',
        message: template.messages[Math.floor(Math.random() * template.messages.length)],
    };
}

/**
 * Get a random affection DM (rare)
 * @param {string} userId - User ID
 * @returns {Object|null} DM content if should send
 */
function checkRandomAffectionDm(userId) {
    const template = DM_TEMPLATES.randomAffection;
    const { minIntimacy, chance, cooldownHours } = template.conditions;

    // Check cooldown
    if (!dmCooldownOps.canSendDm(userId)) return null;

    // Check intimacy
    const memory = ikaMemoryOps.get(userId);
    if (!memory || (memory.intimacy_stage || 1) < minIntimacy) return null;

    // Random chance
    if (Math.random() > chance) return null;

    // Check cooldown for this type
    const lastDm = unpromptedDmOps.getLastOfType(userId, 'randomAffection');
    if (lastDm) {
        const hoursSince = (Date.now() - new Date(lastDm.sent_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < cooldownHours) return null;
    }

    return {
        type: 'randomAffection',
        message: template.messages[Math.floor(Math.random() * template.messages.length)],
    };
}

/**
 * Check if a check-in DM should be sent
 * @param {string} userId - User ID
 * @param {number} daysQuiet - Days since user messaged
 * @returns {Object|null} DM content if should send
 */
function checkCheckInDm(userId, daysQuiet) {
    const template = DM_TEMPLATES.checkIn;
    const { minIntimacy, daysQuiet: threshold, chance } = template.conditions;

    if (daysQuiet < threshold) return null;

    // Check cooldown
    if (!dmCooldownOps.canSendDm(userId)) return null;

    // Check intimacy
    const memory = ikaMemoryOps.get(userId);
    if (!memory || (memory.intimacy_stage || 1) < minIntimacy) return null;

    // Random chance
    if (Math.random() > chance) return null;

    // Check if already sent check-in recently
    const lastDm = unpromptedDmOps.getLastOfType(userId, 'checkIn');
    if (lastDm) {
        const daysSinceDm = (Date.now() - new Date(lastDm.sent_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDm < 7) return null;
    }

    return {
        type: 'checkIn',
        message: template.messages[Math.floor(Math.random() * template.messages.length)],
    };
}

/**
 * Send an unprompted DM
 * @param {Object} client - Discord client
 * @param {string} userId - User ID
 * @param {Object} dmContent - { type, message }
 * @returns {Promise<boolean>} Whether DM was sent
 */
async function sendUnpromptedDm(client, userId, dmContent) {
    if (!dmContent) return false;

    // Check opt-in status first
    if (!canSendUnprompted(userId)) {
        console.log(`✧ Skipping unprompted DM to ${userId} - not opted in`);
        return false;
    }

    // Get memory for personalization
    const memory = ikaMemoryOps.get(userId);
    const personalizedMessage = personalizeMessage(dmContent.message, memory);

    // Use centralized DM sending (no fallback for unprompted)
    const result = await sendUnpromptedDM(client, userId, personalizedMessage, dmContent.type);

    if (result.success) {
        // Log the DM
        unpromptedDmOps.log(userId, dmContent.type, personalizedMessage);
        dmCooldownOps.recordDmSent(userId);
        console.log(`♡ Sent unprompted DM (${dmContent.type}) to ${userId}`);
        return true;
    } else {
        console.log(`✧ Unprompted DM to ${userId} failed: ${result.reason}`);
        return false;
    }
}

/**
 * Run unprompted DM check loop
 * This should be called periodically (e.g., every hour)
 * Only checks users who have OPTED IN via /dms enable
 * @param {Object} client - Discord client
 */
async function runUnpromptedDmCheck(client) {
    if (!config.ika?.unpromptedDmsEnabled) return;

    try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;

        // Get ONLY users who have opted in to unprompted DMs
        const optedInUsers = dmPrefsOps.getOptedInUsers();
        if (!optedInUsers || optedInUsers.length === 0) {
            console.log('✧ No users opted in to unprompted DMs');
            return;
        }

        const now = Date.now();
        console.log(`✧ Checking unprompted DMs for ${optedInUsers.length} opted-in users`);

        for (const optedInUser of optedInUsers) {
            const memberId = optedInUser.user_id;

            // Double-check opt-in status (belt and suspenders)
            if (!canSendUnprompted(memberId)) continue;

            // Try to fetch member
            const member = await guild.members.fetch(memberId).catch(() => null);
            if (!member || member.user.bot) continue;

            // Get memory
            const memory = ikaMemoryOps.get(memberId);
            if (!memory) continue;

            // Calculate days since last interaction
            const lastInteraction = memory.last_interaction
                ? new Date(memory.last_interaction).getTime()
                : now;
            const daysSinceInteraction = (now - lastInteraction) / (1000 * 60 * 60 * 24);

            // Check various DM triggers (in priority order)
            let dmContent = null;

            // Late night check (only 2-4am)
            if (!dmContent) {
                dmContent = await checkLateNightDm(client, memberId);
            }

            // Random affection (very rare)
            if (!dmContent) {
                dmContent = checkRandomAffectionDm(memberId);
            }

            // Thinking of you (rare)
            if (!dmContent) {
                dmContent = checkThinkingOfYouDm(memberId);
            }

            // Missed you (after absence)
            if (!dmContent && daysSinceInteraction >= 3) {
                // If they just came online after being away
                if (member.presence?.status === 'online' || member.presence?.status === 'idle') {
                    dmContent = checkSawYouOnlineDm(memberId, daysSinceInteraction);
                }
                if (!dmContent) {
                    dmContent = checkMissedYouDm(memberId, daysSinceInteraction);
                }
            }

            // Check-in (after extended quiet)
            if (!dmContent && daysSinceInteraction >= 5) {
                dmContent = checkCheckInDm(memberId, daysSinceInteraction);
            }

            // Send DM if we got one
            if (dmContent) {
                await sendUnpromptedDm(client, memberId, dmContent);
                // Only send one DM per check cycle per user
            }
        }
    } catch (error) {
        console.error('✧ Error in unprompted DM check:', error);
    }
}

/**
 * Trigger a post-vulnerability DM (called after vulnerability moment)
 * Only sends if user has opted in to unprompted DMs
 * @param {Object} client - Discord client
 * @param {string} userId - User ID
 * @param {number} delayMs - Delay before sending (default 5-10 minutes)
 */
async function schedulePostVulnerabilityDm(client, userId, delayMs = null) {
    if (!config.ika?.unpromptedDmsEnabled) return;

    // Check opt-in status before scheduling
    if (!canSendUnprompted(userId)) {
        console.log(`✧ Skipping post-vulnerability DM for ${userId} - not opted in`);
        return;
    }

    // Random delay between 5-10 minutes
    const delay = delayMs || (5 * 60 * 1000 + Math.random() * 5 * 60 * 1000);

    setTimeout(async () => {
        // Re-check opt-in at send time (they might have opted out)
        if (!canSendUnprompted(userId)) return;

        const dmContent = getPostVulnerabilityDm(userId);
        if (dmContent) {
            await sendUnpromptedDm(client, userId, dmContent);
        }
    }, delay);
}

/**
 * Personalize DM with user's name/nickname
 * @param {string} message - Base message
 * @param {Object} memory - User's memory record
 * @returns {string} Personalized message
 */
function personalizeMessage(message, memory) {
    if (!memory) return message;

    // Sometimes use their nickname if we have one
    if (memory.nickname && Math.random() < 0.3) {
        return `${memory.nickname}. ${message}`;
    }

    // Sometimes use their real name if we know it (rare)
    if (memory.real_name && Math.random() < 0.1) {
        return message.replace(/^hey\.?/i, `hey ${memory.real_name.split(' ')[0].toLowerCase()}.`);
    }

    return message;
}

module.exports = {
    DM_TEMPLATES,
    checkLateNightDm,
    checkMissedYouDm,
    checkThinkingOfYouDm,
    getPostVulnerabilityDm,
    checkSawYouOnlineDm,
    checkRandomAffectionDm,
    checkCheckInDm,
    sendUnpromptedDm,
    runUnpromptedDmCheck,
    schedulePostVulnerabilityDm,
    personalizeMessage,
};
