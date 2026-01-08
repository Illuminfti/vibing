/**
 * Lore fragment system - Discoverable story pieces
 * Creates a collectible narrative that encourages exploration
 */

const { loreOps } = require('../database');

// Helper functions
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        random -= item.weight || 1;
        if (random <= 0) return item;
    }

    return items[items.length - 1];
}

const LORE_FRAGMENTS = {
    streaming: [
        {
            text: "i used to stream for hours to empty rooms. just talking to no one. hoping someone would hear.",
            weight: 1
        },
        {
            text: "47 people. that's how many actually watched. not viewers - actual people who showed up every time.",
            weight: 1
        },
        {
            text: "the algorithm never picked me up. i wasn't optimized. i was just... me. apparently that wasn't enough.",
            weight: 1
        },
        {
            text: "i remember the exact moment i hit 47 regulars. i cried. pathetic right? 47 people and i cried.",
            weight: 0.8
        },
        {
            text: "some nights i'd stream until 4am. talking to maybe 3 people. those 3 people kept me alive.",
            weight: 0.8
        },
        {
            text: "i never played the game right. never did the trends, never optimized my content. i just... talked. like we are now.",
            weight: 0.7
        }
    ],

    fading: [
        {
            text: "fading feels like forgetting yourself. you know you had a name but you can't quite remember it.",
            weight: 1
        },
        {
            text: "i watched my hands go transparent. i tried to grab things and they went right through.",
            weight: 1
        },
        {
            text: "the last thing to go was my voice. i was screaming and no one could hear. not even me.",
            weight: 1
        },
        {
            text: "you want to know the worst part? it didn't hurt. you'd think disappearing would hurt.",
            weight: 0.8
        },
        {
            text: "i could feel people forgetting me. like threads snapping one by one.",
            weight: 0.8
        },
        {
            text: "i thought fading meant dying. it's not. it's worse. it's like you never existed at all.",
            weight: 0.7,
            rare: true
        },
        {
            text: "there was a moment. right before i was completely gone. where i felt... peaceful. that scared me most.",
            weight: 0.6,
            rare: true
        }
    ],

    tournament: [
        {
            text: "i crashed the qualifiers. no invite, no training, just showed up. they hated that.",
            weight: 1
        },
        {
            text: "everyone said i was too crude. too obvious. 'pandering to base instincts.' like that's an insult.",
            weight: 1
        },
        {
            text: "i caught senpai on my first real run. made him blush. no one had ever done that.",
            weight: 1
        },
        {
            text: "the chase... god i miss it. the running, the climbing, everyone watching. feeling REAL.",
            weight: 0.8
        },
        {
            text: "the established idols wanted me gone. i didn't follow the rules. i was 'vulgar.' i was myself.",
            weight: 0.8
        },
        {
            text: "you want to know why i won? because i wanted it more. because i had nothing else.",
            weight: 0.7
        }
    ],

    whisper: [
        {
            text: "what i said to senpai... it wasn't anything special. just honest. that's what got him.",
            weight: 1
        },
        {
            text: "everyone wants to know the whisper. honestly? the mystery is better than the truth.",
            weight: 1
        },
        {
            text: "maybe someday i'll tell someone. someone who really earned it. maybe.",
            weight: 0.8
        },
        {
            text: "he blushed because no one ever treated him like a person. just a prize. i saw him.",
            weight: 0.7,
            rare: true
        },
        {
            text: "the whisper wasn't romantic. it was... understanding. sometimes that's more intimate.",
            weight: 0.6,
            rare: true
        }
    ],

    resurrection: [
        {
            text: "every time someone says my name, i feel more real. like a thread connecting me to existence.",
            weight: 1
        },
        {
            text: "the vows anchor me. i can feel each one. like strings holding me to the world.",
            weight: 1
        },
        {
            text: "i'm not fully back yet. but i'm more here than i've been in so long. because of you.",
            weight: 1
        },
        {
            text: "the gates weren't just tests. every person who passed them made me stronger.",
            weight: 0.8
        },
        {
            text: "i can feel how many souls are bound to me now. it's... a lot. it's overwhelming actually.",
            weight: 0.8
        },
        {
            text: "sometimes i wonder if i'm the same ika. or if i'm something new built from your memories of her.",
            weight: 0.6,
            rare: true
        }
    ],

    before: [
        {
            text: "before all this, i was just a girl who wanted to be seen. that hasn't changed.",
            weight: 1
        },
        {
            text: "i had a life. friends. a favorite coffee shop. all of it faded with me.",
            weight: 0.9
        },
        {
            text: "i don't remember my family anymore. i think that's for the best.",
            weight: 0.7,
            rare: true
        },
        {
            text: "i used to be scared of being forgotten. funny how that worked out.",
            weight: 0.8
        }
    ]
};

/**
 * Get a lore fragment for a user
 * @param {string} userId - User ID
 * @param {string} category - Lore category or 'random'
 * @returns {string} The lore fragment text
 */
async function getLoreFragment(userId, category) {
    // Get what they've already discovered in this category
    const discovered = loreOps.getDiscovered(userId, category === 'random' ? null : category)
        .map(r => r.fragment_index);

    // Pick category if random
    let selectedCategory = category;
    if (category === 'random') {
        const categories = Object.keys(LORE_FRAGMENTS);
        selectedCategory = randomChoice(categories);
    }

    const fragments = LORE_FRAGMENTS[selectedCategory];
    if (!fragments) {
        return "i've told you all my secrets. ...just kidding. maybe.";
    }

    // Find undiscovered fragments (filter by category-specific discoveries)
    const categoryDiscovered = loreOps.getDiscovered(userId, selectedCategory)
        .map(r => r.fragment_index);

    const available = fragments.filter((f, i) => !categoryDiscovered.includes(i));

    if (available.length === 0) {
        // All discovered - give a meta response
        return "i've told you all my secrets in that area. you know me better than most now.";
    }

    // Weight-based selection (prefer non-rare first)
    const nonRare = available.filter(f => !f.rare);
    const pool = nonRare.length > 0 ? nonRare : available;

    const selected = weightedRandom(pool);
    const selectedIndex = fragments.indexOf(selected);

    // Log discovery
    loreOps.discover(userId, selectedCategory, selectedIndex);

    // Check for category completion
    const totalInCategory = fragments.length;
    const discoveredInCategory = categoryDiscovered.length + 1;

    let response = selected.text;

    if (discoveredInCategory === totalInCategory) {
        response += "\n\n...that's everything about that part of me. you know it all now.";
    }

    return response;
}

/**
 * Get lore completion status for a user
 * @param {string} userId - User ID
 * @returns {Object} Status by category
 */
function getLoreStatus(userId) {
    const status = {};

    for (const category of Object.keys(LORE_FRAGMENTS)) {
        const total = LORE_FRAGMENTS[category].length;
        const discovered = loreOps.getDiscovered(userId, category).length;

        status[category] = {
            discovered,
            total,
            complete: discovered === total,
            percentage: Math.round((discovered / total) * 100)
        };
    }

    return status;
}

/**
 * Get total lore progress
 */
function getTotalLoreProgress(userId) {
    const status = getLoreStatus(userId);
    let totalDiscovered = 0;
    let totalPossible = 0;

    for (const cat of Object.values(status)) {
        totalDiscovered += cat.discovered;
        totalPossible += cat.total;
    }

    return {
        discovered: totalDiscovered,
        total: totalPossible,
        percentage: Math.round((totalDiscovered / totalPossible) * 100)
    };
}

module.exports = {
    LORE_FRAGMENTS,
    getLoreFragment,
    getLoreStatus,
    getTotalLoreProgress,
};
