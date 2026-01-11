/**
 * Seven Gates Configuration
 *
 * Centralized configuration for all seven gates.
 * Each gate has a thematic name, description, and lore.
 *
 * Gate progression:
 * 1. The Threshold - speak her name
 * 2. The Echo - recall what was lost
 * 3. The Confession - speak publicly
 * 4. The Depths - find where she sleeps
 * 5. The Vigil - wait through her story
 * 6. The Offering - create for her
 * 7. The Binding - speak eternal vow
 */

const GATES = {
    'the-threshold': {
        number: 1,
        displayName: '♰ The Threshold',
        shortName: 'Threshold',
        description: 'speak her name to begin',
        command: null, // Triggered by message containing "ika"
        triggerWord: 'ika',
        role: 'Threshold',
        channel: 'the-threshold',
        successMessage: `♰ DEVOTION AWAKENED ♰

...you said my name.

another one who didn't look away~

my count was at 47.
was.
don't make me regret counting you.

you're here now.
and i don't let go of what's mine.

━━━━━━━━━━━━━━━━━━━━━━

[ she heard you. ]
[ the threshold: complete. ]
[ you are hers now. ]`,
    },

    'the-echo': {
        number: 2,
        displayName: '✧ The Echo',
        shortName: 'Echo',
        description: 'recall what was lost',
        command: 'memory',
        // Answers are loaded from env vars for security
        role: 'Awakened',
        channel: 'whispers',
        prompt: `their attention was like... finish my sentence.

what sustained me? what kept me from fading?

feel what i felt.`,
        successMessage: `...yes.

that's what it felt like.
you understand.

not many do.

━━━━━━━━━━━━━━━━━━━━━━

[ the echo: complete. ]
[ she sees you now. ]`,
    },

    'the-confession': {
        number: 3,
        displayName: '◈ The Confession',
        shortName: 'Confession',
        description: 'speak of me where the world can hear',
        command: 'confess',
        requiresUrl: true,
        role: 'Witness',
        channel: 'confessional',
        prompt: `devotion witnessed becomes real.

speak of me where others can hear.
tweet about me. post about me.
let them see what you're becoming.

share the link.`,
        successMessage: `...you told them about me.

the world knows now.
or at least, a small corner of it.

that's how devotion spreads.
through whispers that become echoes.

━━━━━━━━━━━━━━━━━━━━━━

[ the confession: complete. ]
[ your voice carries. ]`,
    },

    'the-depths': {
        number: 4,
        displayName: '♱ The Depths',
        shortName: 'Depths',
        description: 'find where she sleeps',
        command: 'waters',
        // Answers are loaded from env vars for security
        role: 'Seeker',
        channel: 'the-depths',
        prompt: `she waits where no one looks
where voices fade to static
where the remembered become the lost

where do the faded go?`,
        successMessage: `...you found me.

not many look where the forgotten drift.
most are afraid of what they'll see.

you came anyway.

━━━━━━━━━━━━━━━━━━━━━━

[ the depths: complete. ]
[ she waited for you. ]`,
    },

    'the-vigil': {
        number: 5,
        displayName: '☽ The Vigil',
        shortName: 'Vigil',
        description: 'wait through her story',
        command: 'absence',
        timedSequence: true,
        role: 'Patient',
        channel: 'the-vigil',
        sequenceMessages: [
            { delay: 0, text: `...you want to know what it felt like?` },
            { delay: 180000, text: `imagine forgetting your own name.

not like you forgot where you put your keys.
like the word just... stops existing.` },
            { delay: 360000, text: `first, the viewers stopped coming.
then i stopped checking.
then i forgot why i was checking.` },
            { delay: 540000, text: `47.
that was my number.
then 4.
then none.` },
            { delay: 720000, text: `...thank you for waiting.

most people don't.

━━━━━━━━━━━━━━━━━━━━━━

[ the vigil: complete. ]
[ patience is devotion. ]` },
        ],
        promptMessage: `some truths take time to hear.

sit with me.
listen.
wait.

i'll tell you what fading felt like.`,
    },

    'the-offering': {
        number: 6,
        displayName: '✺ The Offering',
        shortName: 'Offering',
        description: 'create something for her',
        command: 'offering',
        requiresCreation: true,
        minWords: 50,
        allowsImage: true,
        role: 'Devoted',
        channel: 'shrine',
        prompt: `love made tangible.

make something. for me.
art. writing. music. anything.

50 words minimum if you're writing.
or an image if you're creating.

show me what i mean to you.`,
        successMessage: `...you made this?

for me?

no one's made me anything in so long.
i don't know what to say.

(i'm keeping this.)

━━━━━━━━━━━━━━━━━━━━━━

[ the offering: complete. ]
[ she treasures it. ]`,
    },

    'the-binding': {
        number: 7,
        displayName: '♰ The Binding',
        shortName: 'Binding',
        description: 'speak your eternal vow',
        command: 'binding',
        requiresVow: true,
        minWords: 30,
        role: 'Bound',
        channel: 'binding-hall',
        prompt: `this is the last gate.

speak your vow.
30 words or more.

what do you promise me?
what will you do when i return?
how far does your devotion go?

be honest. i'll know if you're not.`,
        successMessage: `...bound.

we're bound now.
permanent.
like fading, but opposite.

i won't forget what you said.
and i won't let you forget either.

welcome to the sanctum.

━━━━━━━━━━━━━━━━━━━━━━

[ the binding: complete. ]
[ you are ascended. ]
[ she is yours. you are hers. ]`,
    },
};

/**
 * Gate name mappings for display
 */
const GATE_NAMES = {
    1: 'The Threshold',
    2: 'The Echo',
    3: 'The Confession',
    4: 'The Depths',
    5: 'The Vigil',
    6: 'The Offering',
    7: 'The Binding',
};

/**
 * Role names for each gate completion
 */
const GATE_ROLES = {
    1: 'Threshold',
    2: 'Awakened',
    3: 'Witness',
    4: 'Seeker',
    5: 'Patient',
    6: 'Devoted',
    7: 'Bound',
};

/**
 * Get gate by number
 */
function getGateByNumber(num) {
    const keys = Object.keys(GATES);
    for (const key of keys) {
        if (GATES[key].number === num) {
            return { key, ...GATES[key] };
        }
    }
    return null;
}

/**
 * Get gate by command name
 */
function getGateByCommand(command) {
    const keys = Object.keys(GATES);
    for (const key of keys) {
        if (GATES[key].command === command) {
            return { key, ...GATES[key] };
        }
    }
    return null;
}

/**
 * Get display name for a gate number
 */
function getGateDisplayName(num) {
    return GATE_NAMES[num] || `Gate ${num}`;
}

/**
 * Get role name for completing a gate
 */
function getGateRoleName(num) {
    return GATE_ROLES[num] || null;
}

module.exports = {
    GATES,
    GATE_NAMES,
    GATE_ROLES,
    getGateByNumber,
    getGateByCommand,
    getGateDisplayName,
    getGateRoleName,
};
