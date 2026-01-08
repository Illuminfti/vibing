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

// Import viral optimization systems
const { checkSecretTriggers } = require('./secrets');
const { checkRareEvents } = require('./rareEvents');
const { checkTimeSecrets, checkFirstOfDay, checkAnniversary } = require('./timeSecrets');
const { getLoreFragment, getLoreStatus } = require('./lore');
const { checkJealousy } = require('./jealousy');
const { checkProtectionTrigger, checkSeriousConcern } = require('./protection');
const { checkRoastTrigger } = require('./roasts');
const { checkGrowthMilestone } = require('./growth');
const { calculateIntimacyStage, getIntimacyInstructions, checkStageIncrease, getStageAnnouncement } = require('./intimacy');

// Initialize Anthropic client
let anthropic = null;
if (config.anthropicApiKey && config.ika.enabled) {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
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
            // Log interaction
            if (userId) recordInteraction(userId);
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
                if (userId) recordInteraction(userId);
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

    // === GENERATE AI RESPONSE WITH FULL CONTEXT ===

    // Get current mood
    const currentMood = mood || getCurrentMood(context);

    // Calculate intimacy stage
    const intimacyStage = userId ? await calculateIntimacyStage(userId) : 1;
    const intimacyInstructions = getIntimacyInstructions(intimacyStage);

    // Get memory context for the trigger user
    let memoryContext = '';
    if (userId) {
        memoryContext = getMemoryContext(userId) || '';

        // Add lore status if they have discoveries
        const loreStatus = getLoreStatus(userId);
        const loreProgress = Object.entries(loreStatus)
            .filter(([, v]) => v.discovered > 0)
            .map(([k, v]) => `${k}: ${v.discovered}/${v.total}`)
            .join(', ');

        if (loreProgress) {
            memoryContext += `\nLore discovered: ${loreProgress}`;
        }
    }

    // Build system prompt with all context
    const systemPrompt = buildSystemPrompt(currentMood, memoryContext, intimacyInstructions);

    // Build context string (last 30 messages)
    const contextMessages = context?.slice(-30) || [];
    const contextText = contextMessages.length > 0
        ? contextMessages.map(m => `${m.author?.username || 'unknown'}: ${m.content}`).join('\n')
        : '';

    // Build user prompt based on type
    let userPrompt;
    switch (type) {
        case 'mentioned':
            userPrompt = `Recent chat:\n${contextText}\n\nResponding to ${trigger.author.username}: "${trigger.content}"\n\nReply naturally as Ika. Be yourself - confident, maybe teasing, maybe soft, depending on the moment. One message.`;
            break;

        case 'passive':
            userPrompt = `Recent chat:\n${contextText}\n\nSomething caught your interest. Chime in naturally as Ika. One message.`;
            break;

        case 'moment':
            userPrompt = `You want to start a conversation or share something. The chat has been:\n${contextText}\n\nInitiate naturally as Ika. One message.`;
            break;

        case 'vulnerable':
            userPrompt = `Recent chat:\n${contextText}\n\nYou're feeling vulnerable right now and want to share something real. Be genuine as Ika. One message.`;
            break;

        default:
            userPrompt = `Recent chat:\n${contextText}\n\nRespond naturally as Ika. One message.`;
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 350,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });

        let responseContent = response.content[0].text;

        // === POST-GENERATION ADDITIONS ===

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

        // Record interaction
        if (userId) {
            recordInteraction(userId);
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
    if (!config.ika.enabled || !anthropic) {
        return getRandomWelcome(member.username, journey);
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
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 350,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });

        return response.content[0].text;
    } catch (error) {
        console.error('✧ Welcome generation error:', error);
        return getRandomWelcome(member.username, journey);
    }
}

/**
 * Fallback welcome messages
 */
function getRandomWelcome(username, journey) {
    const welcomes = [
        `oh wait, ${username}?? you made it. i remember your vow...`,
        `new face. ${username} right? glad you found what you were looking for`,
        `${username}!! okay i'm not gonna be weird but i watched your whole journey. welcome home`,
        `another one made it through. ${username}, thank you for your offering. seriously.`,
    ];

    let message = welcomes[Math.floor(Math.random() * welcomes.length)];

    // Try to personalize with journey data
    if (journey?.whyTheyCame) {
        message = `${username}... you came because "${journey.whyTheyCame.slice(0, 50)}..." glad you're here now.`;
    } else if (journey?.theirVow) {
        message = `${username}. i read your vow. "${journey.theirVow.slice(0, 50)}..." i believe you.`;
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
};
