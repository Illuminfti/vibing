/**
 * Roast system - Affectionate teasing
 * Creates playful banter that shows intimacy through gentle mockery
 */

const { ikaMemoryExtOps } = require('../database');

// Helper function
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const ROAST_TRIGGERS = {
    selfDeprecating: {
        patterns: [
            /i('m| am) (bad|trash|terrible|awful) at/i,
            /i suck at/i,
            /i('m| am) so bad/i
        ],
        responses: [
            "skill issue",
            "couldn't be me",
            "have you tried being better at it",
            "sounds like a you problem (affectionate)",
            "get good",
            "L"
        ],
        chance: 0.15
    },

    cantDoSomething: {
        patterns: [
            /i can't/i,
            /i don't know how/i,
            /it's too hard/i
        ],
        responses: [
            "not with that attitude",
            "believe in yourself or whatever. idk i'm not your mom",
            "you absolutely can. you just don't want to. which is valid honestly.",
            "have you tried just... doing it anyway",
            "skill issue tbh"
        ],
        chance: 0.12
    },

    dramatic: {
        patterns: [
            /i('m| am) (dying|dead)/i,
            /kill me/i,
            /end me/i,
            /this is the worst/i
        ],
        responses: [
            "you'll survive. probably.",
            "thoughts and prayers",
            "rip bozo (lovingly)",
            "i'll remember you fondly",
            "press f to pay respects",
            "literally deceased"
        ],
        chance: 0.2
    },

    bored: {
        patterns: [
            /i('m| am) bored/i,
            /nothing to do/i,
            /so bored/i
        ],
        responses: [
            "entertain yourself, you have a whole internet",
            "and you're telling ME this because...?",
            "skill issue tbh",
            "be more interesting then",
            "sounds rough. anyway",
            "have you tried touching grass"
        ],
        chance: 0.15
    },

    tired: {
        patterns: [
            /i('m| am) (so )?tired/i,
            /exhausted/i,
            /so sleepy/i
        ],
        responses: [
            "sleep then coward",
            "same but i'm not complaining about it",
            "drink water or something idk",
            "that sounds like a problem for you",
            "have you considered: sleep"
        ],
        chance: 0.1
    },

    hungry: {
        patterns: [
            /i('m| am) hungry/i,
            /starving/i,
            /need food/i
        ],
        responses: [
            "eat then???",
            "food exists. go get some.",
            "skill issue",
            "have you tried: eating",
            "go consume calories"
        ],
        chance: 0.15
    },

    procrastinating: {
        patterns: [
            /should be (working|studying)/i,
            /procrastinating/i,
            /i have work/i
        ],
        responses: [
            "and yet here you are. talking to me. interesting.",
            "sounds like a future you problem",
            "i'm definitely more important than whatever that is",
            "go do it then. ...or stay. i won't tell.",
            "productivity is overrated anyway"
        ],
        chance: 0.2
    },

    late: {
        patterns: [
            /i should sleep/i,
            /it's (so )?late/i,
            /should go to bed/i
        ],
        responses: [
            "and yet...",
            "that sounds like quitter talk",
            "sleep is for the weak (go sleep though)",
            "okay goodnight. ...wait no stay",
            "one more message won't hurt"
        ],
        chance: 0.15
    },

    flexing: {
        patterns: [
            /i('m| am) (so )?smart/i,
            /easy/i,
            /too easy/i,
            /i('m| am) (the )?best/i
        ],
        responses: [
            "humble",
            "okay calm down",
            "weird flex but okay",
            "i'll believe it when i see it",
            "prove it"
        ],
        chance: 0.25
    }
};

/**
 * Check if roast should trigger
 * @param {string} content - Message content
 * @returns {Object} { shouldRoast: boolean, response: string, type: string }
 */
function checkRoastTrigger(content) {
    if (!content) return { shouldRoast: false };

    for (const [type, data] of Object.entries(ROAST_TRIGGERS)) {
        for (const pattern of data.patterns) {
            if (pattern.test(content) && Math.random() < data.chance) {
                return {
                    shouldRoast: true,
                    response: randomChoice(data.responses),
                    type
                };
            }
        }
    }

    return { shouldRoast: false };
}

/**
 * Track roast and return response
 * @param {string} userId - User ID
 * @param {string} type - Roast type
 * @returns {string} Roast response
 */
async function handleRoast(userId, type) {
    // Track the roast
    ikaMemoryExtOps.incrementRoasts(userId);

    // Return appropriate response
    const data = ROAST_TRIGGERS[type];
    if (data) {
        return randomChoice(data.responses);
    }

    // Fallback generic roasts
    const genericRoasts = [
        "skill issue",
        "couldn't be me",
        "L",
        "sounds rough",
        "anyway"
    ];

    return randomChoice(genericRoasts);
}

/**
 * Get comeback for when user tries to roast Ika
 */
function getComeback(content) {
    const comebackTriggers = [
        { pattern: /you('re| are) (weird|strange|crazy)/i, responses: ["thanks i try", "you say that like it's a bad thing", "and yet you're still here"] },
        { pattern: /you('re| are) mean/i, responses: ["and you love it", "only to people i like", "affectionately"] },
        { pattern: /shut up/i, responses: ["make me", "no <3", "i refuse"] },
        { pattern: /go away/i, responses: ["no", "you first", "i literally live here"] },
        { pattern: /whatever/i, responses: ["exactly", "mhm", "that's what i thought"] }
    ];

    for (const trigger of comebackTriggers) {
        if (trigger.pattern.test(content)) {
            return {
                hasComeback: true,
                response: randomChoice(trigger.responses)
            };
        }
    }

    return { hasComeback: false };
}

/**
 * Special roast for people who roast themselves too much
 */
function getSelfRoastIntervention() {
    const interventions = [
        "okay you've roasted yourself enough for today. my turn now.",
        "save some self-deprecation for the rest of us",
        "if you're gonna roast yourself at least be funny about it",
        "i didn't give you permission to be mean to my favorite person"
    ];

    return randomChoice(interventions);
}

module.exports = {
    ROAST_TRIGGERS,
    checkRoastTrigger,
    handleRoast,
    getComeback,
    getSelfRoastIntervention,
};
