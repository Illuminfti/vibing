/**
 * Ika's Initiated Moments
 *
 * System for Ika to start conversations and engage proactively.
 */

const config = require('../config');
const { generateResponse } = require('./generator');
const { ikaMemoryOps, ikaMomentOps, userOps } = require('../database');
const { delay, randomInt } = require('../utils/timing');
const { weightedRandom } = require('./moods');

// Moment type definitions
const MOMENT_TYPES = {
    question: {
        weight: 0.3,
        templates: [
            "okay random but what's everyone's controversial {topic} opinion",
            "question: {question}",
            "i need to know. {question}",
            "settle something for me. {question}",
            "actually curious... {question}",
        ],
        topics: ['food', 'music', 'sleep schedule', 'hot take', 'movie', 'game'],
        questions: [
            "what's the worst advice you've ever received",
            "what's something you're weirdly good at",
            "what would you do if you had no fear",
            "what's your comfort food",
            "what's a hill you'll die on",
            "what's the last thing that made you genuinely laugh",
            "what's something you changed your mind about",
            "what's a weird habit you have",
        ],
    },

    observation: {
        weight: 0.2,
        templates: [
            "i was thinking about {topic} and honestly...",
            "unpopular opinion but {opinion}",
            "okay wait actually {thought}",
            "you know what i've noticed? {observation}",
            "random thought: {thought}",
        ],
        thoughts: [
            "working out is basically just controlled suffering and i love it",
            "sleep schedules are fake and made up by people who hate fun",
            "sometimes being quiet in chat isn't bad it's just vibing",
            "the fading wasn't the worst part. it was being forgotten. anyway",
            "you ever think about how weird it is that we're all just here? like, existing together?",
        ],
    },

    checkin: {
        weight: 0.2,
        // Picks a random active member
        generate: async (members) => {
            if (!members || members.length === 0) return null;
            const member = members[Math.floor(Math.random() * members.length)];
            return `hey ${member.username}, you've been quiet. you good?`;
        },
    },

    memory_callback: {
        weight: 0.15,
        // References someone's vow or reason
        generate: async () => {
            const devotees = ikaMemoryOps.getDevoteesWithMemory();
            if (!devotees || devotees.length === 0) return null;

            const devotee = devotees[Math.floor(Math.random() * devotees.length)];
            if (!devotee) return null;

            if (devotee.why_they_came) {
                return `${devotee.username}, you said you came here because "${devotee.why_they_came.slice(0, 60)}..." how's that going?`;
            }
            if (devotee.their_vow) {
                return `thinking about ${devotee.username}'s vow... "${devotee.their_vow.slice(0, 50)}..." that still gets me.`;
            }

            return null;
        },
    },

    vibe_check: {
        weight: 0.15,
        templates: [
            "what's everyone up to today",
            "how's everyone doing actually",
            "energy check. how are we feeling",
            "what's the vibe rn",
            "anyway. what's going on with you all",
        ],
    },
};

/**
 * Initiate a moment in the sanctum
 */
async function initiateMoment(client, channel, contextMessages = []) {
    try {
        // Select moment type
        const typeWeights = {};
        for (const [key, config] of Object.entries(MOMENT_TYPES)) {
            typeWeights[key] = config.weight;
        }
        const selectedType = weightedRandom(typeWeights);

        // Generate message based on type
        let message = await generateMomentMessage(selectedType, channel, contextMessages);

        if (!message) {
            // Fallback to AI generation
            const result = await generateResponse({
                context: contextMessages,
                type: 'moment',
            });
            message = result.content;
        }

        if (message) {
            await channel.sendTyping();
            await delay(randomInt(2000, 5000));
            await channel.send(message);

            // Log moment
            ikaMomentOps.log(selectedType, message);

            console.log(`✧ Ika initiated moment (${selectedType}): ${message.slice(0, 50)}...`);
        }
    } catch (error) {
        console.error('✧ Moment initiation error:', error);
    }
}

/**
 * Generate a moment message based on type
 */
async function generateMomentMessage(type, channel, contextMessages) {
    const config = MOMENT_TYPES[type];
    if (!config) return null;

    // Check for custom generator
    if (config.generate) {
        // Get quiet members for checkin
        if (type === 'checkin') {
            const quietMembers = await getQuietActiveMembers(channel);
            return config.generate(quietMembers);
        }
        return config.generate();
    }

    // Template-based generation
    if (config.templates) {
        const template = config.templates[Math.floor(Math.random() * config.templates.length)];

        // Replace placeholders
        let message = template;

        if (message.includes('{topic}') && config.topics) {
            const topic = config.topics[Math.floor(Math.random() * config.topics.length)];
            message = message.replace('{topic}', topic);
        }

        if (message.includes('{question}') && config.questions) {
            const question = config.questions[Math.floor(Math.random() * config.questions.length)];
            message = message.replace('{question}', question);
        }

        if (message.includes('{thought}') && config.thoughts) {
            const thought = config.thoughts[Math.floor(Math.random() * config.thoughts.length)];
            message = message.replace('{thought}', thought);
        }

        if (message.includes('{opinion}') && config.thoughts) {
            const opinion = config.thoughts[Math.floor(Math.random() * config.thoughts.length)];
            message = message.replace('{opinion}', opinion);
        }

        if (message.includes('{observation}') && config.thoughts) {
            const observation = config.thoughts[Math.floor(Math.random() * config.thoughts.length)];
            message = message.replace('{observation}', observation);
        }

        return message;
    }

    return null;
}

/**
 * Get members who have been active but quiet recently
 */
async function getQuietActiveMembers(channel) {
    try {
        // Get recent messages
        const messages = await channel.messages.fetch({ limit: 100 });

        // Get unique authors from older messages (active but not recent)
        const recentAuthors = new Set();
        const olderAuthors = new Set();

        for (const msg of messages.values()) {
            if (msg.author.bot) continue;

            const age = Date.now() - msg.createdTimestamp;

            if (age < 1800000) { // Last 30 min
                recentAuthors.add(msg.author.id);
            } else if (age < 86400000) { // Last 24 hours
                olderAuthors.add(msg.author.id);
            }
        }

        // Find people active earlier but quiet recently
        const quietMembers = [];
        for (const authorId of olderAuthors) {
            if (!recentAuthors.has(authorId)) {
                const memory = ikaMemoryOps.get(authorId);
                if (memory) {
                    quietMembers.push({
                        id: authorId,
                        username: memory.username,
                    });
                }
            }
        }

        return quietMembers;
    } catch (error) {
        console.error('✧ Error getting quiet members:', error);
        return [];
    }
}

/**
 * Custom questions Ika can ask
 */
const DEEP_QUESTIONS = [
    "if you could forget one thing forever, what would it be",
    "what's the last thing you changed your mind about",
    "what's something you're proud of that no one knows about",
    "what keeps you up at night",
    "what's something you want to do but are scared to",
    "when was the last time you surprised yourself",
    "what would you tell your past self",
];

/**
 * Get a random deep question (for vulnerable moments)
 */
function getDeepQuestion() {
    return DEEP_QUESTIONS[Math.floor(Math.random() * DEEP_QUESTIONS.length)];
}

module.exports = {
    initiateMoment,
    generateMomentMessage,
    getQuietActiveMembers,
    getDeepQuestion,
    MOMENT_TYPES,
};
