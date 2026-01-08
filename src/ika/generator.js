/**
 * Ika's Response Generator
 *
 * Integrates with Claude API to generate Ika's responses.
 */

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { buildSystemPrompt, checkCannedTrigger, getRandomCanned } = require('./personality');
const { getCurrentMood } = require('./moods');
const { getMemoryContext, recordInteraction, shouldReferenceJourney, getJourneyReference } = require('./memory');
const { ikaMemoryOps, ikaMessageOps, ikaStateOps } = require('../database');

// Initialize Anthropic client
let anthropic = null;
if (config.anthropicApiKey && config.ika.enabled) {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
}

/**
 * Generate a response from Ika
 */
async function generateResponse(options) {
    const {
        trigger,           // The message that triggered this (if any)
        context,           // Recent messages for context
        type,              // Response type: 'mentioned', 'passive', 'moment', 'vulnerable'
        mood,              // Override mood (optional)
        forceGenerate,     // Skip canned response check
    } = options;

    // Check if AI is enabled
    if (!config.ika.enabled || !anthropic) {
        console.log('✧ Ika AI disabled, using fallback');
        return getFallbackResponse(type);
    }

    // Check for canned responses first (unless forced)
    if (!forceGenerate && trigger) {
        const cannedCheck = checkCannedTrigger(trigger.content);
        if (cannedCheck) {
            const response = getRandomCanned(cannedCheck.type);
            if (response) {
                return {
                    content: response,
                    type: cannedCheck.type,
                    generated: false,
                };
            }
        }
    }

    // Get current mood
    const currentMood = mood || getCurrentMood(context);

    // Get memory context for the trigger user
    let memoryContext = '';
    if (trigger?.author?.id) {
        memoryContext = getMemoryContext(trigger.author.id) || '';
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(currentMood, memoryContext);

    // Build context string
    const contextText = context && context.length > 0
        ? context.map(m => `${m.author?.username || 'unknown'}: ${m.content}`).join('\n')
        : '';

    // Build user prompt based on type
    let userPrompt;
    switch (type) {
        case 'mentioned':
            userPrompt = `Recent chat:\n${contextText}\n\nResponding to ${trigger.author.username}: "${trigger.content}"\n\nReply naturally as Ika. One message, keep it concise.`;
            break;

        case 'passive':
            userPrompt = `Recent chat:\n${contextText}\n\nSomething in this conversation caught your interest. Chime in naturally as Ika. One message.`;
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
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });

        let content = response.content[0].text;

        // Maybe add journey reference for devoted users
        if (trigger?.author?.id && shouldReferenceJourney()) {
            const memory = ikaMemoryOps.get(trigger.author.id);
            if (memory && memory.relationship_level === 'devoted') {
                const reference = getJourneyReference(memory);
                if (reference) {
                    content += reference;
                }
            }
        }

        // Record interaction
        if (trigger?.author?.id) {
            recordInteraction(trigger.author.id);
        }

        // Log the message
        ikaMessageOps.log(
            trigger?.channel?.id,
            trigger?.author?.id,
            trigger?.content,
            content,
            type,
            currentMood
        );

        // Update last spoke timestamp
        ikaStateOps.setLastSpoke();

        return {
            content,
            mood: currentMood,
            type,
            generated: true,
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

    const systemPrompt = buildSystemPrompt('energetic', '');

    const userPrompt = `A new person just completed all seven gates and entered the Inner Sanctum! Their name is ${member.username}.

Their journey:
- They said attention felt like: "${journey.memoryAnswer || 'unknown'}"
- They confessed at: ${journey.confessionUrl || 'somewhere'}
- They came because: "${journey.whyTheyCame || 'unknown reason'}"
- They vowed: "${journey.theirVow || 'something'}"

Welcome them personally as Ika. Reference their journey. One message, be excited but genuine.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
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

module.exports = {
    generateResponse,
    generateWelcomeMessage,
    canRespond,
    getFallbackResponse,
};
