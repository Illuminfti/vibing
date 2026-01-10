/**
 * Ika's Response Generator
 *
 * Integrates with Claude API to generate Ika's responses.
 * Enhanced with viral optimization systems for richer interactions.
 */

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { buildSystemPrompt, checkCannedTrigger, getRandomCanned, getMoodInstructions } = require('./personality');
const { getCurrentMood } = require('./moods');
const { getMemoryContext, recordInteraction, shouldReferenceJourney, getJourneyReference } = require('./memory');
const { ikaMemoryOps, ikaMessageOps, ikaStateOps, ikaMemoryExtOps } = require('../database');
const { scoreInteractionQuality } = require('./interactionQuality');

/**
 * Helper to record interaction with quality scoring
 * @param {string} userId - User ID
 * @param {string} content - Message content
 * @param {object} options - Additional options for scoring
 */
function recordInteractionWithQuality(userId, content, options = {}) {
    if (!userId || !content) {
        // Fallback to default multiplier if missing data
        recordInteraction(userId, 1.0);
        return;
    }

    const qualityMultiplier = scoreInteractionQuality(content, {
        messageLength: content.length,
        hasQuestion: content.includes('?'),
        conversationDepth: options.conversationDepth || 0,
        isRapidFire: options.isRapidFire || false,
    });

    recordInteraction(userId, qualityMultiplier);

    // Log exceptional quality interactions
    if (qualityMultiplier >= 1.5) {
        console.log(`✧ High quality interaction from user ${userId} (${qualityMultiplier.toFixed(2)}x)`);
    } else if (qualityMultiplier <= 0.7) {
        console.log(`✧ Low quality interaction from user ${userId} (${qualityMultiplier.toFixed(2)}x)`);
    }
}

// Import viral optimization systems
const { checkSecretTriggers } = require('./secrets');
const { checkRareEvents } = require('./rareEvents');
const { checkTimeSecrets, checkFirstOfDay, checkAnniversary } = require('./timeSecrets');
const { getLoreFragment, getLoreStatus } = require('./lore');
const { checkJealousy } = require('./jealousy');
const { checkProtectionTrigger, checkSeriousConcern } = require('./protection');
const { checkRoastTrigger } = require('./roasts');
const { checkGrowthMilestone } = require('./growth');
const { calculateIntimacyStage, getIntimacyInstructions, checkStageIncrease, getStageAnnouncement, checkIntimacyDecay, getDecayMessage } = require('./intimacy');

// Import daily engagement system
const {
    checkDaily,
    getStreakContext,
    getMilestoneMessage,
    shouldAcknowledgeStreak,
    getFirstMessageAck,
} = require('./daily');

// Voice filter (Vibing Overhaul P0-Critical)
const { filterResponse, getContextHint } = require('./voiceFilter');

// Import cost optimization systems (v3.3.1)
const {
    shouldUseAi,
    consumeQuota,
    getChannelType,
    getCurrentMode,
    getRestingResponse,
    getLengthLimits,
    compressPrompt,
} = require('../utils/costMode');
const { getExpandedResponse } = require('../utils/expandedCanned');

// Initialize Anthropic client
let anthropic = null;
if (config.anthropicApiKey && config.ika.enabled) {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
}

/**
 * Get user's preferred name (nickname or username)
 * @param {string} userId - Discord user ID
 * @param {string} fallbackUsername - Discord username as fallback
 * @returns {string} Preferred name to use
 */
function getPreferredName(userId, fallbackUsername) {
    const memory = ikaMemoryOps.get(userId);
    if (memory?.nickname) {
        return memory.nickname;
    }
    return fallbackUsername;
}

/**
 * Resolve Discord mentions to readable usernames
 * Turns <@123456789> into @username
 */
function resolveMentions(content, mentions) {
    if (!content || !mentions) return content || '';

    let resolved = content;

    // Resolve user mentions
    if (mentions.users) {
        mentions.users.forEach(user => {
            const mentionPattern = new RegExp(`<@!?${user.id}>`, 'g');
            resolved = resolved.replace(mentionPattern, `@${user.username}`);
        });
    }

    // Resolve role mentions
    if (mentions.roles) {
        mentions.roles.forEach(role => {
            const rolePattern = new RegExp(`<@&${role.id}>`, 'g');
            resolved = resolved.replace(rolePattern, `@${role.name}`);
        });
    }

    // Resolve channel mentions
    if (mentions.channels) {
        mentions.channels.forEach(channel => {
            const channelPattern = new RegExp(`<#${channel.id}>`, 'g');
            resolved = resolved.replace(channelPattern, `#${channel.name}`);
        });
    }

    return resolved;
}

/**
 * Generate a response from Ika
 * Enhanced with viral optimization priority system
 */
async function generateResponse(options) {
    const {
        trigger,           // The message that triggered this (if any)
        context,           // Recent messages for context
        type,              // Response type: 'mentioned', 'passive', 'moment', 'vulnerable'
        mood,              // Override mood (optional)
        forceGenerate,     // Skip canned response check
    } = options;

    const userId = trigger?.author?.id;
    const content = trigger?.content || '';

    // === DAILY ENGAGEMENT SYSTEM: Check daily streak (silent, background) ===
    let dailyCheck = null;
    if (userId) {
        dailyCheck = checkDaily(userId);
    }

    // Set first interaction timestamp if not set
    if (userId) {
        ikaMemoryExtOps.setFirstInteraction(userId);
    }

    // === PRIORITY 1: Serious mental health concerns ===
    if (content) {
        const serious = checkSeriousConcern(content);
        if (serious.serious) {
            return {
                content: serious.response,
                type: 'protection',
                generated: false,
                priority: 'serious',
            };
        }
    }

    // === PRIORITY 2: Protection triggers ===
    if (content) {
        const protection = checkProtectionTrigger(content);
        if (protection.shouldProtect) {
            if (userId) {
                ikaMemoryExtOps.incrementProtection(userId);
            }
            return {
                content: protection.response,
                type: 'protection',
                generated: false,
                priority: 'protection',
            };
        }
    }

    // === PRIORITY 3: Secret phrase triggers ===
    if (userId && content) {
        const secret = await checkSecretTriggers(
            trigger,
            userId,
            (uid, cat) => getLoreFragment(uid, cat)
        );
        if (secret.triggered) {
            // Log interaction with quality scoring
            if (userId) recordInteractionWithQuality(userId, trigger.content);
            return {
                content: secret.response,
                type: 'secret',
                category: secret.category,
                generated: false,
                priority: 'secret',
            };
        }
    }

    // === PRIORITY 4: Time-based secrets ===
    if (userId) {
        const timeSecret = await checkTimeSecrets(userId);
        if (timeSecret.triggered) {
            return {
                content: timeSecret.message,
                type: 'timeSecret',
                secret: timeSecret.secret,
                generated: false,
                priority: 'timeSecret',
            };
        }
    }

    // === PRIORITY 5: Rare events ===
    if (userId && context) {
        const rareEvent = await checkRareEvents(trigger, userId, context);
        if (rareEvent.triggered) {
            return {
                content: rareEvent.response,
                type: 'rareEvent',
                event: rareEvent.event,
                generated: false,
                priority: 'rareEvent',
            };
        }
    }

    // === PRIORITY 6: Roast opportunities (lower chance) ===
    if (content) {
        const roast = checkRoastTrigger(content);
        if (roast.shouldRoast) {
            if (userId) {
                ikaMemoryExtOps.incrementRoasts(userId);
            }
            return {
                content: roast.response,
                type: 'roast',
                roastType: roast.type,
                generated: false,
                priority: 'roast',
            };
        }
    }

    // === PRIORITY 7: Jealousy check ===
    if (userId && context && context.length > 10) {
        const botId = trigger?.client?.user?.id;
        if (botId) {
            const jealousy = await checkJealousy(trigger, context, userId, botId);
            if (jealousy.triggered) {
                if (userId) {
                    ikaMemoryExtOps.incrementJealousy(userId);
                }
                return {
                    content: jealousy.response,
                    type: 'jealousy',
                    generated: false,
                    priority: 'jealousy',
                };
            }
        }
    }

    // === Check for canned responses (unless forced) ===
    if (!forceGenerate && trigger) {
        const cannedCheck = checkCannedTrigger(trigger.content);
        if (cannedCheck) {
            const response = getRandomCanned(cannedCheck.type);
            if (response) {
                if (userId) recordInteractionWithQuality(userId, trigger.content);
                return {
                    content: response,
                    type: cannedCheck.type,
                    generated: false,
                };
            }
        }
    }

    // Check if AI is enabled
    if (!config.ika.enabled || !anthropic) {
        console.log('✧ Ika AI disabled, using fallback');
        return getFallbackResponse(type);
    }

    // === COST MODE CHECK (v3.3.1) ===
    // Determine user tier and check if AI should be used
    const channelType = trigger?.channel?.id
        ? getChannelType(trigger.channel, config)
        : 'other';

    // Get user tier from memory
    const userMemory = userId ? ikaMemoryOps.get(userId) : null;
    const userTier = userMemory?.relationship_level || 'new';

    // Skip cost mode check if forceGenerate is true (inner sanctum always uses AI)
    let aiDecision = { useAi: true, reason: 'forced' };
    if (!forceGenerate) {
        // Check cost mode decision
        aiDecision = shouldUseAi(userId, userTier, channelType, {
            mentioned: type === 'mentioned',
        });
    }

    if (!aiDecision.useAi) {
        // AI not allowed - use alternative response
        if (aiDecision.reason === 'channel_restricted') {
            // Ika is "resting" outside sanctum
            if (userId) recordInteractionWithQuality(userId, trigger?.content || '');
            return {
                content: aiDecision.alternative,
                type: 'resting',
                generated: false,
                reason: 'channel_restricted',
            };
        }

        if (aiDecision.reason === 'quota_exhausted') {
            // User hit daily limit
            if (userId) recordInteractionWithQuality(userId, trigger?.content || '');
            return {
                content: aiDecision.alternative,
                type: 'quota_limit',
                generated: false,
                reason: 'quota_exhausted',
            };
        }

        if (aiDecision.reason === 'canned_roll') {
            // Cost mode rolled for canned response - use expanded canned system
            const intimacyStage = userTier === 'ascended' ? 5 : userTier === 'devoted' ? 4 : userTier === 'normal' ? 2 : 1;
            const expandedResponse = getExpandedResponse(
                trigger?.content || '',
                { channelType, intimacyStage }
            );
            if (expandedResponse) {
                if (userId) recordInteractionWithQuality(userId, trigger?.content || '');
                return {
                    content: expandedResponse,
                    type: 'canned',
                    generated: false,
                    reason: 'cost_optimization',
                };
            }
            // Fall through to AI if no suitable canned response
        }
    }

    // === GENERATE AI RESPONSE WITH FULL CONTEXT ===

    // Get current mood
    const currentMood = mood || getCurrentMood(context);

    // Check for intimacy decay before calculating stage
    let decayInfo = null;
    if (userId) {
        const decay = checkIntimacyDecay(userId);
        if (decay.decayed) {
            const decayMsg = getDecayMessage(decay.oldStage, decay.newStage, decay.daysInactive);
            decayInfo = {
                message: decayMsg,
                oldStage: decay.oldStage,
                newStage: decay.newStage,
                daysInactive: decay.daysInactive
            };
        }
    }

    // Calculate intimacy stage
    const intimacyStage = userId ? await calculateIntimacyStage(userId) : 1;
    let intimacyInstructions = getIntimacyInstructions(intimacyStage);

    // Get preferred name and add name usage instructions based on intimacy
    if (userId && trigger?.author?.username) {
        const preferredName = getPreferredName(userId, trigger.author.username);
        const memory = ikaMemoryOps.get(userId);

        // Add nickname awareness if they have one
        if (memory?.nickname && preferredName !== trigger.author.username) {
            intimacyInstructions += `\n\nYou call ${trigger.author.username} "${preferredName}" as a nickname.`;
        }

        // Add name usage frequency instructions based on intimacy stage
        if (intimacyStage >= 2) {
            intimacyInstructions += `\n\nUse their name occasionally in your responses to show familiarity.`;
        }
        if (intimacyStage >= 3) {
            intimacyInstructions += `\n\nUse their name/nickname frequently - you're close now. Their name: ${preferredName}`;
        }
        if (intimacyStage >= 4) {
            intimacyInstructions += `\n\nUse their name often and possessively. They're yours. Their name: ${preferredName}`;
        }
    }

    // Get memory context for the trigger user
    let memoryContext = '';
    if (userId) {
        memoryContext = getMemoryContext(userId) || '';

        // Add decay context if relationship decayed
        if (decayInfo) {
            memoryContext += `\n[IMPORTANT: Intimacy decayed from stage ${decayInfo.oldStage} to ${decayInfo.newStage} after ${decayInfo.daysInactive} days inactive. Acknowledge this naturally: "${decayInfo.message}"]`;
        }

        // Add lore status if they have discoveries
        const loreStatus = getLoreStatus(userId);
        const loreProgress = Object.entries(loreStatus)
            .filter(([, v]) => v.discovered > 0)
            .map(([k, v]) => `${k}: ${v.discovered}/${v.total}`)
            .join(', ');

        if (loreProgress) {
            memoryContext += `\nLore discovered: ${loreProgress}`;
        }

        // Add daily streak context if this is their first message today
        if (dailyCheck && dailyCheck.isFirst) {
            const streakContext = getStreakContext(dailyCheck.streak, dailyCheck.isFirst, dailyCheck.wasBroken);
            if (streakContext) {
                memoryContext += `\n${streakContext}`;
            }
        }
    }

    // Build system prompt with all context
    const systemPrompt = buildSystemPrompt(currentMood, memoryContext, intimacyInstructions);

    // Build context string (last 8 messages including bot, excluding trigger)
    const triggerId = trigger?.id;
    const botId = trigger?.client?.user?.id;
    const contextMessages = (context || [])
        .filter(m => m.id !== triggerId)  // Only exclude the trigger message
        .slice(-8);  // Keep last 8 for conversation flow
    const contextText = contextMessages.length > 0
        ? contextMessages.map(m => {
            const isBot = m.author?.bot || m.author?.id === botId;
            const name = isBot ? 'Ika (you)' : getPreferredName(m.author.id, m.author?.username || 'unknown');
            // Resolve mentions to usernames
            const content = resolveMentions(m.content, m.mentions);
            return `${name}: ${content}`;
        }).join('\n')
        : '';

    // Also resolve mentions in the trigger content
    const triggerContent = trigger ? resolveMentions(trigger.content, trigger.mentions) : '';

    // Get preferred name for user prompts
    const preferredName = userId && trigger?.author?.username ? getPreferredName(userId, trigger.author.username) : (trigger?.author?.username || 'someone');

    // Build user prompt based on type
    let userPrompt;
    switch (type) {
        case 'mentioned':
            userPrompt = `RESPOND ONLY TO THE CURRENT MESSAGE. The chat history is just for context - do NOT address old messages.\n\nChat history (background only):\n${contextText}\n\n===\nCURRENT MESSAGE TO RESPOND TO:\n${preferredName}: "${triggerContent}"\n===\n\nReply to "${triggerContent}" naturally as Ika. One short message. Do not reference or respond to older messages from the history.`;
            break;

        case 'passive':
            userPrompt = `RESPOND ONLY TO THE CURRENT MESSAGE. The chat history is just for context - do NOT address old messages.\n\nChat history (background only):\n${contextText}\n\n===\nCURRENT MESSAGE:\n${preferredName}: "${triggerContent}"\n===\n\nRespond to "${triggerContent}" naturally as Ika. One short message.`;
            break;

        case 'moment':
            userPrompt = `You want to start a conversation or share something. The chat has been:\n${contextText}\n\nInitiate naturally as Ika. One message.`;
            break;

        case 'vulnerable':
            userPrompt = `Recent chat history:\n${contextText}\n\nYou're feeling vulnerable right now and want to share something real. Be genuine as Ika. One message.`;
            break;

        default:
            userPrompt = `RESPOND ONLY TO THE CURRENT MESSAGE.\n\nChat history (background only):\n${contextText}\n\n===\nCURRENT MESSAGE:\n${preferredName}: "${triggerContent}"\n===\n\nRespond to the current message naturally as Ika. One short message.`;
    }

    try {
        // Get model config from cost mode (v3.3.1)
        const modelConfig = aiDecision.model || {
            id: 'claude-sonnet-4-20250514',
            maxTokens: 350,
        };

        // Apply length limits based on cost mode
        const limits = getLengthLimits();
        const { prompt: compressedPrompt } = compressPrompt(userPrompt, {
            recentMessages: contextMessages,
        });

        const response = await anthropic.messages.create({
            model: modelConfig.id,
            max_tokens: Math.min(modelConfig.maxTokens || 350, limits.maxResponseTokens || 350),
            system: systemPrompt,
            messages: [{ role: 'user', content: compressedPrompt }],
        });

        // Consume quota after successful API call
        if (userId && aiDecision.useAi) {
            consumeQuota(userId);
        }

        let responseContent = response.content[0].text;

        // === VOICE FILTER (Vibing Overhaul P0-Critical) ===
        // Apply character consistency guard to AI outputs
        const contextHint = getContextHint(trigger?.content || '');
        const voiceResult = filterResponse(responseContent, contextHint);

        if (voiceResult.filtered) {
            console.log(`✧ Voice filter activated: ${voiceResult.reason}`);
            console.log(`✧ Voice purity score: ${voiceResult.score}/100`);
            responseContent = voiceResult.content;
        }

        // === POST-GENERATION ADDITIONS ===

        // Check for daily streak milestone
        if (userId && dailyCheck && dailyCheck.milestone) {
            if (shouldAcknowledgeStreak(dailyCheck.milestone, dailyCheck.streak)) {
                const milestoneMsg = getMilestoneMessage(dailyCheck.milestone);
                if (milestoneMsg) {
                    responseContent += `\n\n...${milestoneMsg}`;
                }
            }
        }

        // Check for growth milestone
        if (userId) {
            const growth = await checkGrowthMilestone(userId);
            if (growth) {
                responseContent += `\n\n...${growth.response}`;
            }
        }

        // Check for intimacy stage increase
        if (userId) {
            const stageChange = checkStageIncrease(userId, intimacyStage);
            if (stageChange.increased) {
                const announcement = getStageAnnouncement(stageChange.newStage);
                if (announcement) {
                    // This could be sent as a follow-up or incorporated
                    // For now, log it
                    console.log(`✧ ${trigger.author.username} reached intimacy stage ${stageChange.newStage}`);
                }
            }
        }

        // Maybe add journey reference for devoted users
        if (userId && shouldReferenceJourney()) {
            const memory = ikaMemoryOps.get(userId);
            if (memory && memory.relationship_level === 'devoted') {
                const reference = getJourneyReference(memory);
                if (reference) {
                    responseContent += reference;
                }
            }
        }

        // Check for first message of day
        if (userId) {
            const firstOfDay = checkFirstOfDay(userId);
            if (firstOfDay.isFirst && firstOfDay.message && Math.random() < 0.3) {
                responseContent = firstOfDay.message + '\n\n' + responseContent;
            }
        }

        // Check for anniversary
        if (userId) {
            const memory = ikaMemoryOps.get(userId);
            if (memory?.first_interaction_at) {
                const anniversary = checkAnniversary(userId, memory.first_interaction_at);
                if (anniversary.isAnniversary && anniversary.message) {
                    responseContent += `\n\n...${anniversary.message}`;
                }
            }
        }

        // Score interaction quality and record with multiplier
        if (userId) {
            // Calculate conversation depth (number of user messages in recent context)
            const conversationDepth = contextMessages.filter(m => {
                const isBot = m.author?.bot || m.author?.id === botId;
                return !isBot;
            }).length;

            // Record with quality scoring (includes detailed context)
            recordInteractionWithQuality(userId, trigger.content, {
                conversationDepth: conversationDepth,
            });
        }

        // Log the message
        ikaMessageOps.log(
            trigger?.channel?.id,
            userId,
            trigger?.content,
            responseContent,
            type,
            currentMood
        );

        // Update last spoke timestamp
        ikaStateOps.setLastSpoke();

        return {
            content: responseContent,
            mood: currentMood,
            type,
            generated: true,
            intimacyStage,
        };

    } catch (error) {
        console.error('✧ Ika generation error:', error);
        return getFallbackResponse(type);
    }
}

/**
 * Get a fallback response when AI is unavailable
 */
function getFallbackResponse(type) {
    const fallbacks = {
        mentioned: [
            "hmm?",
            "yes?",
            "oh, hey",
            "lol",
            "what's up",
        ],
        passive: [
            "lol",
            "interesting...",
            "hmm",
            "wait really",
            "oh?",
        ],
        moment: [
            "...",
            "thinking about things",
            "hey everyone",
        ],
        vulnerable: [
            "...",
            "just thinking",
            "you know what, never mind",
        ],
    };

    const options = fallbacks[type] || fallbacks.mentioned;
    return {
        content: options[Math.floor(Math.random() * options.length)],
        type,
        generated: false,
        fallback: true,
    };
}

/**
 * Generate a welcome message for new ascended member
 */
async function generateWelcomeMessage(member, journey) {
    // Get nickname if exists
    const memory = ikaMemoryOps.get(member.id);
    const nickname = memory?.nickname;

    if (!config.ika.enabled || !anthropic) {
        return getRandomWelcome(member.username, journey, nickname);
    }

    const systemPrompt = buildSystemPrompt('energetic', '', '');

    const userPrompt = `A new person just completed all seven gates and entered the Inner Sanctum! Their name is ${member.username}.

Their journey:
- They said attention felt like: "${journey.memoryAnswer || 'unknown'}"
- They confessed at: ${journey.confessionUrl || 'somewhere'}
- They came because: "${journey.whyTheyCame || 'unknown reason'}"
- They vowed: "${journey.theirVow || 'something'}"

Welcome them personally as Ika. Reference their journey. One message, be excited but genuine. Make them feel like they belong now.`;

    try {
        // Welcome messages are for ascended users in sanctum - always use good model
        const modeConfig = getCurrentMode();
        const modelId = modeConfig.model === 'claude-haiku'
            ? 'claude-haiku-4-20250514'
            : 'claude-sonnet-4-20250514';

        const response = await anthropic.messages.create({
            model: modelId,
            max_tokens: 350,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });

        return response.content[0].text;
    } catch (error) {
        console.error('✧ Welcome generation error:', error);
        return getRandomWelcome(member.username, journey, nickname);
    }
}

/**
 * Fallback welcome messages
 */
function getRandomWelcome(username, journey, nickname = null) {
    const name = nickname || username;

    const welcomes = [
        `oh wait, ${name}?? you made it. i remember your vow...`,
        `new face. ${name} right? glad you found what you were looking for`,
        `${name}!! okay i'm not gonna be weird but i watched your whole journey. welcome home`,
        `another one made it through. ${name}, thank you for your offering. seriously.`,
        `${name}. you're here. finally.`,
    ];

    let message = welcomes[Math.floor(Math.random() * welcomes.length)];

    // Try to personalize with journey data
    if (journey?.whyTheyCame) {
        message = `${name}... you came because "${journey.whyTheyCame.slice(0, 50)}..." glad you're here now.`;
    } else if (journey?.theirVow) {
        message = `${name}. i read your vow. "${journey.theirVow.slice(0, 50)}..." i believe you.`;
    }

    return message;
}

/**
 * Check if enough time has passed since last response
 */
function canRespond() {
    const lastSpoke = ikaStateOps.getLastSpoke();
    return Date.now() - lastSpoke >= config.ika.cooldownMs;
}

/**
 * Update protection count for user
 */
async function updateProtectionCount(userId) {
    ikaMemoryExtOps.incrementProtection(userId);
}

/**
 * Update roast count for user
 */
async function updateRoastCount(userId) {
    ikaMemoryExtOps.incrementRoasts(userId);
}

module.exports = {
    generateResponse,
    generateWelcomeMessage,
    canRespond,
    getFallbackResponse,
    updateProtectionCount,
    updateRoastCount,
    getPreferredName,
};
