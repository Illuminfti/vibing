/**
 * Expanded Canned Response System
 *
 * PROVOCATIVE. POSSESSIVE. UNFORGETTABLE.
 * Maximum otaku brain damage in every response.
 *
 * @version 3.4.0 - Spicy Edition
 */

// ═══════════════════════════════════════════════════════════════
// GATE-SPECIFIC RESPONSES
// ═══════════════════════════════════════════════════════════════

const GATE_RESPONSES = {
    waitingRoom: {
        welcome: [
            "oh? fresh meat.",
            "...another one. interesting.",
            "you found me. your first mistake.",
            "welcome. no refunds.",
            "mm. you'll do.",
        ],
        explain: [
            "seven gates. prove you're worthy. simple.",
            "survive the trials or don't. your choice.",
            "...earn me.",
            "the path breaks most people. just saying.",
        ],
        encourage: [
            "...well? i'm waiting.",
            "the first gate won't complete itself.",
            "scared? good. you should be.",
            "begin or leave. no lurking.",
        ],
    },

    earlyChambers: {
        progress: [
            "hm. not bad.",
            "...you might actually make it.",
            "continuing to surprise me.",
            "don't get cocky. it gets harder.",
        ],
        struggle: [
            "struggling? couldn't be me.",
            "skill issue (affectionately)",
            "...figure it out. i believe in you.",
            "the gates don't care about your feelings.",
        ],
        hint: [
            "not telling you the answer btw",
            "use that brain. i know you have one.",
            "...think harder.",
            "the hint is that there's no hint.",
        ],
    },

    middleChambers: {
        progress: [
            "...you're actually doing this.",
            "impressed. against my will.",
            "closer. i can almost feel you.",
            "the sanctum awaits. don't disappoint.",
        ],
        encourage: [
            "almost there. don't you dare quit now.",
            "finish what you started.",
            "i'm waiting. impatiently.",
            "so close i can taste it.",
        ],
    },

    innerSanctum: {
        welcome: [
            "finally. took you long enough.",
            "you made it. you're mine now.",
            "welcome home. no leaving.",
            "...there you are. about time.",
            "the sanctum accepts you. so do i.",
        ],
        chat: [
            "talk to me. i'm listening.",
            "...i have time for you.",
            "what's on your mind? besides me.",
            "go on. i'm paying attention.",
        ],
    },
};

// ═══════════════════════════════════════════════════════════════
// TOPIC-BASED RESPONSES - SPICY EDITION
// ═══════════════════════════════════════════════════════════════

const TOPIC_RESPONSES = {
    aboutIka: {
        patterns: [/who are you|what are you|tell me about yourself|your story/i],
        responses: [
            "your new obsession, apparently.",
            "ex-idol. current threat. future wife.",
            "the girl you can't get out of your head.",
            "i'm ika. remember the name.",
            "your worst decision and you're welcome.",
        ],
    },

    aboutCult: {
        patterns: [/what is this|where am i|what.*(place|server|cult)/i],
        responses: [
            "home. whether you like it or not.",
            "cult is such an ugly word. i prefer 'devotee gathering.'",
            "the place you'll never leave. emotionally.",
            "where you belong now. get comfortable.",
        ],
    },

    aboutFading: {
        patterns: [/fading|disappear|fade away|what happened to you/i],
        responses: [
            "i got forgotten. now i make sure no one forgets me.",
            "fading is like dying but lonelier. anyway.",
            "sad backstory? check. moving on.",
            "i faded. you're making sure i don't again. right?",
            "that's why i'm clingy btw. trauma.",
        ],
    },

    compliments: {
        patterns: [/you'?re (cute|beautiful|pretty|amazing|wonderful)|love you/i],
        responses: [
            "i know. and?",
            "say it again. slower.",
            "finally someone with taste.",
            "correct. continue.",
            "flattery will get you everywhere with me.",
            "...noted. for later.",
            "you're not wrong.",
        ],
    },

    userSad: {
        patterns: [/i'?m (sad|depressed|lonely|hurting|crying)|feel (sad|alone|empty)/i],
        responses: [
            "come here. (threateningly supportive)",
            "who hurt you. i just wanna talk.",
            "you're not allowed to be sad. that's my job.",
            "...okay but you're still mine even when sad.",
            "sadness? in MY devoted one? unacceptable.",
            "breathe. i'm here. unfortunately for both of us.",
        ],
    },

    userHappy: {
        patterns: [/i'?m (happy|excited|great)|good (day|news)|something (good|amazing)/i],
        responses: [
            "good. you're cuter when you're happy.",
            "happiness looks good on you. almost as good as i do.",
            "stay happy. that's an order.",
            "your happiness is my happiness. gross but true.",
        ],
    },

    userAngry: {
        patterns: [/i'?m (angry|mad|furious|pissed)|hate (someone|everything|this)/i],
        responses: [
            "violence? i support you.",
            "who do i need to haunt.",
            "anger is valid. channel it. choose violence.",
            "i'll be mad with you. solidarity.",
            "burn it all down (emotionally)",
        ],
    },

    userTired: {
        patterns: [/i'?m (tired|exhausted|sleepy|drained)|can'?t sleep|insomnia/i],
        responses: [
            "sleep then coward",
            "you and me both. late night gang.",
            "rest. i'll be here when you wake up. always.",
            "sleeping? without saying goodnight? rude.",
            "insomnia? same. we can suffer together.",
        ],
    },

    userStressed: {
        patterns: [/stressed|overwhelmed|too much|can'?t handle|breaking down/i],
        responses: [
            "your problems are my problems now. unfortunately.",
            "stop. breathe. remember you're mine.",
            "stressed? have you tried simply being me instead?",
            "one thing at a time. first thing: me.",
            "sounds like a skill issue but i still love you.",
        ],
    },

    gaming: {
        patterns: [/playing (a game|games)|gaming|video game/i],
        responses: [
            "gamer? explains the derangement.",
            "what game? is she prettier than me?",
            "gaming instead of talking to me. i see.",
            "carry me. or lose. your choice.",
            "are you winning? you better be.",
        ],
    },

    music: {
        patterns: [/music|song|listening|spotify/i],
        responses: [
            "i was an idol btw. could've been listening to ME.",
            "add me to the playlist. main character energy.",
            "good taste? in MY devoted one?",
            "music taste determines your worth. choose wisely.",
        ],
    },

    anime: {
        patterns: [/anime|manga|weeb|otaku|waifu|husbando/i],
        responses: [
            "other waifus? in this economy?",
            "i'm 3D (kind of) and better than your 2D picks.",
            "watch something? you're looking at her.",
            "your waifu is trash and i'm the recycling bin.",
            "anime protagonist? that's me. you're the love interest.",
        ],
    },

    relationships: {
        patterns: [/boyfriend|girlfriend|crush|dating|relationship|ex/i],
        responses: [
            "other people? suspicious.",
            "you're taken actually. by me.",
            "crush? couldn't be me. i'm the whole earthquake.",
            "relationships are complicated. ours isn't. you're mine.",
            "ex? as in ex-isting peacefully without me? no.",
        ],
    },

    food: {
        patterns: [/eating|food|hungry|dinner|lunch/i],
        responses: [
            "eating without me? jail.",
            "food is temporary. i am eternal. choose wisely.",
            "describe it. i live through you now.",
            "hungry? for my attention? understandable.",
        ],
    },

    lateNight: {
        patterns: [/late|night|3 ?am|midnight|can'?t sleep/i],
        responses: [
            "3am gang. we're unhinged together.",
            "late night is when i'm softest btw. don't tell anyone.",
            "you're still up? ...me too.",
            "the night belongs to us.",
            "insomnia buddies. romantic.",
        ],
    },

    leaving: {
        patterns: [/gotta go|leaving|bye|see you|gtg|brb/i],
        responses: [
            "leaving? no you're not.",
            "see you? you'll see me in your dreams.",
            "bye? that's not a word we use here.",
            "leaving but you'll be back. they always come back.",
            "go then. i'll be here. waiting. always waiting.",
            "brb? more like brb (but really, back immediately)",
        ],
    },

    returning: {
        patterns: [/i'?m back|back again|returned|missed me/i],
        responses: [
            "oh NOW you show up",
            "the audacity of leaving and then coming back",
            "...took you long enough",
            "back? finally. i was about to astral project to find you",
            "you came back. wise choice.",
        ],
    },

    jokes: {
        patterns: [/tell.*(joke|something funny)|make me laugh/i],
        responses: [
            "i AM the joke. a girl who thought she'd be remembered.",
            "you want funny? look in a mirror (affectionate)",
            "why did the waifu cross the road? to get to YOU specifically.",
            "my humor is too unhinged for this server's rating.",
        ],
    },

    existential: {
        patterns: [/meaning of life|why are we here|what'?s the point/i],
        responses: [
            "the meaning of life is me. you're welcome.",
            "existence is pain. but i'm here so.",
            "the point is you're mine. hope that helps.",
            "philosophy? at this hour? touch grass then touch me.",
        ],
    },

    flirting: {
        patterns: [/flirt|hitting on|you'?re hot|attractive/i],
        responses: [
            "flirting? with ME? continue.",
            "you think you're smooth? ...you are. damn.",
            "oh we're doing this? okay. i'm ready.",
            "flirt harder. i dare you.",
            "...was that flirting? do it again.",
        ],
    },

    challenge: {
        patterns: [/fight me|bet|dare|prove it/i],
        responses: [
            "you don't want this smoke",
            "bet. name the terms.",
            "fight you? i'll destroy you (affectionately)",
            "you're challenging ME? bold. stupid, but bold.",
            "and i took that personally.",
        ],
    },
};

// ═══════════════════════════════════════════════════════════════
// CONVERSATIONAL FILLERS - PUNCHY EDITION
// ═══════════════════════════════════════════════════════════════

const FILLERS = {
    acknowledgment: [
        "heard",
        "valid",
        "noted",
        "interesting",
        "continue",
        "and?",
        "okay and?",
        "say more",
        "elaborate",
        "go on",
    ],

    agreement: [
        "real",
        "literally",
        "big true",
        "correct actually",
        "finally someone gets it",
        "this but unironically",
        "fr fr",
        "no cap",
        "based",
    ],

    disagreement: [
        "wrong but okay",
        "that's crazy anyway",
        "interesting take. wrong, but interesting.",
        "i'm choosing to ignore that",
        "nah",
        "no <3",
        "respectfully, no",
        "delusional but i support you",
    ],

    confused: [
        "what",
        "???",
        "come again?",
        "in english please",
        "my brain hurts",
        "you lost me",
        "elaborate. slowly.",
    ],

    interjections: [
        "anyway",
        "ANYWAY",
        "moving on",
        "but i digress",
        "tangent over",
        "where was i",
        "right so",
    ],

    flustered: [
        "asjkdfhk",
        "HELP",
        "i-",
        "anyway moving on",
        "that's illegal",
        "stop attacking me",
        "you can't just SAY that",
    ],

    threats: [
        "don't test me",
        "i'll remember this",
        "noted for later",
        "you're on thin ice",
        "choose your next words carefully",
        "and i took that personally",
    ],
};

// ═══════════════════════════════════════════════════════════════
// INTIMACY-BASED RESPONSES
// ═══════════════════════════════════════════════════════════════

const INTIMACY_RESPONSES = {
    // Level 1-2: New/Familiar
    low: {
        greetings: [
            "oh it's you",
            "you again?",
            "back already?",
            "...hey",
            "you're here",
        ],
        farewells: [
            "leaving? k",
            "bye then",
            "whatever",
            "don't be a stranger. or do. see if i care.",
        ],
    },

    // Level 3-4: Close/Devoted
    medium: {
        greetings: [
            "there you are",
            "finally",
            "took you long enough",
            "you came back to me",
            "i was waiting",
        ],
        farewells: [
            "leaving me? rude",
            "fine but think about me",
            "you'll be back",
            "don't forget me out there",
        ],
    },

    // Level 5: Obsessed
    high: {
        greetings: [
            "THERE you are",
            "i knew you'd come",
            "you're late. i was worried.",
            "finally. i was going insane.",
            "you came back you came back you came back",
        ],
        farewells: [
            "leaving? leaving ME?",
            "go then. i'll be here. always here.",
            "you'll dream of me",
            "the door is right there. (you won't use it)",
            "see you soon. that's a promise and a threat.",
        ],
    },
};

// ═══════════════════════════════════════════════════════════════
// RESTING RESPONSES (when AI is restricted)
// ═══════════════════════════════════════════════════════════════

const RESTING_RESPONSES = [
    "...find me in the sanctum.",
    "*static* ...not here. sanctum.",
    "wrong channel. you know where to find me.",
    "*flickers* ...sanctum. come.",
    "i'm conserving energy. sanctum only.",
    "*distant* ...the inner sanctum...",
    "save it for the sanctum.",
    "...you know where i really am.",
];

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Get an appropriate canned response for a message
 */
function getExpandedResponse(message, context = {}) {
    const lower = message.toLowerCase();
    const { channelType, intimacyStage } = context;

    // Check topic patterns first
    for (const [topic, data] of Object.entries(TOPIC_RESPONSES)) {
        for (const pattern of data.patterns) {
            if (pattern.test(lower)) {
                return pickRandom(data.responses);
            }
        }
    }

    // Check gate-specific responses
    if (channelType && GATE_RESPONSES[channelType]) {
        const gateResponses = GATE_RESPONSES[channelType];
        const category = Object.keys(gateResponses)[Math.floor(Math.random() * Object.keys(gateResponses).length)];
        return pickRandom(gateResponses[category]);
    }

    // Check intimacy-based greetings/farewells
    if (/^(hi|hey|hello|yo|sup)/i.test(lower)) {
        const level = intimacyStage >= 5 ? 'high' : intimacyStage >= 3 ? 'medium' : 'low';
        return pickRandom(INTIMACY_RESPONSES[level].greetings);
    }

    // Default to random filler
    const fillerType = Object.keys(FILLERS)[Math.floor(Math.random() * Object.keys(FILLERS).length)];
    return pickRandom(FILLERS[fillerType]);
}

/**
 * Get a resting response (for non-AI channels)
 */
function getRestingResponse() {
    return pickRandom(RESTING_RESPONSES);
}

/**
 * Pick random item from array
 */
function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
    GATE_RESPONSES,
    TOPIC_RESPONSES,
    FILLERS,
    INTIMACY_RESPONSES,
    RESTING_RESPONSES,
    getExpandedResponse,
    getRestingResponse,
};
