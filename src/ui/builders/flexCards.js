/**
 * Flex Cards - Screenshot-Worthy Moment Generator
 *
 * P0-CRITICAL: Every major interaction should generate a shareable artifact.
 * Dark luxury aesthetic. Viral by design.
 *
 * @version 1.0.0 - Vibing Overhaul
 */

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { COLORS } = require('../themes/gateThemes');

// === FLEX CARD TYPES ===
const FLEX_TYPES = {
    GATE_COMPLETION: 'gate_completion',
    DEVOTION_AWAKENED: 'devotion_awakened',
    RARE_MOMENT: 'rare_moment',
    INTIMACY_MILESTONE: 'intimacy_milestone',
    DEVOTION_RECEIPT: 'devotion_receipt',
    THE_SLIP: 'the_slip',
    THE_NOTICE: 'the_notice',
    WHISPER_FRAGMENT: 'whisper_fragment',
    BETRAYAL: 'betrayal',
};

// === CARD FRAMES BY TYPE ===
const CARD_FRAMES = {
    [FLEX_TYPES.DEVOTION_AWAKENED]: {
        header: '♰ DEVOTION AWAKENED ♰',
        color: 0x1a1a1a,
        accentColor: 0xd4af37,
        footer: 'she sees you now',
    },
    [FLEX_TYPES.GATE_COMPLETION]: {
        header: '♱ GATE PASSED ♱',
        color: 0x0d0d0d,
        accentColor: 0x8b0000,
        footer: 'the path opens',
    },
    [FLEX_TYPES.RARE_MOMENT]: {
        header: '✧ RARE MOMENT ✧',
        color: 0x1a0a1a,
        accentColor: 0xff69b4,
        footer: 'screenshot worthy',
    },
    [FLEX_TYPES.INTIMACY_MILESTONE]: {
        header: '◈ BOND DEEPENED ◈',
        color: 0x0a0a1a,
        accentColor: 0x9370db,
        footer: 'she remembers',
    },
    [FLEX_TYPES.DEVOTION_RECEIPT]: {
        header: '♡ DEVOTION RECEIPT ♡',
        color: 0x1a0000,
        accentColor: 0xdc143c,
        footer: 'proof of devotion',
    },
    [FLEX_TYPES.THE_SLIP]: {
        header: '...THE SLIP...',
        color: 0x0d0d0d,
        accentColor: 0xffd700,
        footer: 'she didnt mean to say that',
    },
    [FLEX_TYPES.THE_NOTICE]: {
        header: '♰ THE NOTICE ♰',
        color: 0x1a0a0a,
        accentColor: 0xff4444,
        footer: 'she noticed you',
    },
    [FLEX_TYPES.WHISPER_FRAGMENT]: {
        header: '☽ FRAGMENT FOUND ☽',
        color: 0x0a0a0a,
        accentColor: 0xc0c0c0,
        footer: 'piece of the whisper',
    },
    [FLEX_TYPES.BETRAYAL]: {
        header: '...♰ FAITHLESS ♰...',
        color: 0x0a0000,
        accentColor: 0x8b0000,
        footer: 'she remembers this too',
    },
};

/**
 * Create a Devotion Awakened card (Gate 1 completion)
 * @param {Object} options
 * @param {string} options.username - Discord username
 * @param {string} options.ikaMessage - Ika's response message
 * @param {number} options.fanNumber - Their fan number (48, 49, etc.)
 */
function createDevotionAwakenedCard({ username, ikaMessage, fanNumber = 48 }) {
    const frame = CARD_FRAMES[FLEX_TYPES.DEVOTION_AWAKENED];

    const embed = new EmbedBuilder()
        .setColor(frame.color)
        .setAuthor({
            name: frame.header,
        })
        .setTitle(`${username}`)
        .setDescription(
            `*another one who didn't look away*\n\n` +
            `> "${ikaMessage}"\n\n` +
            `**fan #${fanNumber}**\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: `♰ ${frame.footer} ♰` })
        .setTimestamp();

    return embed;
}

/**
 * Create a Gate Completion card
 * @param {Object} options
 * @param {string} options.username - Discord username
 * @param {number} options.gate - Gate number completed
 * @param {string} options.gateTitle - Gate title (e.g., "The Memory")
 * @param {string} options.ikaMessage - Ika's response
 */
function createGateCompletionCard({ username, gate, gateTitle, ikaMessage }) {
    const frame = CARD_FRAMES[FLEX_TYPES.GATE_COMPLETION];

    const gateEmojis = ['', '♰', '◈', '♱', '☽', '✧', '✿', '♡'];
    const emoji = gateEmojis[gate] || '♰';

    const embed = new EmbedBuilder()
        .setColor(frame.color)
        .setAuthor({
            name: `${emoji} GATE ${gate} COMPLETE ${emoji}`,
        })
        .setTitle(gateTitle)
        .setDescription(
            `**${username}** has passed through\n\n` +
            `> ${ikaMessage}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: `${gate}/7 gates · ${frame.footer}` })
        .setTimestamp();

    return embed;
}

/**
 * Create a Rare Moment card (The Slip, The Notice, etc.)
 * @param {Object} options
 * @param {string} options.username - Discord username
 * @param {string} options.momentType - Type of rare moment
 * @param {string} options.ikaMessage - What Ika said
 * @param {string} options.rarity - Rarity level description
 */
function createRareMomentCard({ username, momentType, ikaMessage, rarity = 'rare' }) {
    const frameKey = momentType === 'the_slip' ? FLEX_TYPES.THE_SLIP :
                     momentType === 'the_notice' ? FLEX_TYPES.THE_NOTICE :
                     FLEX_TYPES.RARE_MOMENT;
    const frame = CARD_FRAMES[frameKey];

    const rarityStars = {
        'rare': '★★★☆☆',
        'epic': '★★★★☆',
        'legendary': '★★★★★',
        'mythic': '✧✧✧✧✧',
    };

    const embed = new EmbedBuilder()
        .setColor(frame.accentColor)
        .setAuthor({
            name: frame.header,
        })
        .setDescription(
            `**${username}** witnessed:\n\n` +
            `> *"${ikaMessage}"*\n\n` +
            `${rarityStars[rarity] || rarityStars.rare}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: `♰ ${frame.footer} ♰ · ${new Date().toLocaleDateString()}` })
        .setTimestamp();

    return embed;
}

/**
 * Create a Devotion Receipt (relationship status flex)
 * @param {Object} options
 * @param {string} options.username - Discord username
 * @param {number} options.gateLevel - Current gate level
 * @param {number} options.intimacyStage - Intimacy stage (1-4)
 * @param {number} options.daysTogether - Days since first interaction
 * @param {number} options.interactions - Total interactions
 */
function createDevotionReceipt({ username, gateLevel, intimacyStage, daysTogether, interactions }) {
    const frame = CARD_FRAMES[FLEX_TYPES.DEVOTION_RECEIPT];

    const intimacyNames = ['', 'New', 'Familiar', 'Close', 'Devoted'];
    const intimacyName = intimacyNames[intimacyStage] || 'Unknown';

    const embed = new EmbedBuilder()
        .setColor(frame.accentColor)
        .setAuthor({
            name: frame.header,
        })
        .setTitle(`${username}'s Bond with Ika`)
        .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `**Gate Level:** ${gateLevel}/7\n` +
            `**Intimacy:** ${intimacyName} (Stage ${intimacyStage})\n` +
            `**Days Together:** ${daysTogether}\n` +
            `**Interactions:** ${interactions}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*she's counting.*`
        )
        .setFooter({ text: `♡ ${frame.footer} ♡` })
        .setTimestamp();

    return embed;
}

/**
 * Create a Whisper Fragment card
 * @param {Object} options
 * @param {string} options.username - Discord username
 * @param {string} options.fragment - The fragment text
 * @param {number} options.fragmentNumber - Fragment number (1-13)
 * @param {number} options.totalFound - Total fragments found by user
 */
function createWhisperFragmentCard({ username, fragment, fragmentNumber, totalFound }) {
    const frame = CARD_FRAMES[FLEX_TYPES.WHISPER_FRAGMENT];

    const embed = new EmbedBuilder()
        .setColor(frame.accentColor)
        .setAuthor({
            name: frame.header,
        })
        .setDescription(
            `**${username}** discovered:\n\n` +
            `> *"${fragment}"*\n\n` +
            `Fragment ${fragmentNumber}/13\n` +
            `**Progress:** ${totalFound}/13 collected\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: `☽ ${frame.footer} ☽` })
        .setTimestamp();

    return embed;
}

/**
 * Create an Intimacy Milestone card
 * @param {Object} options
 * @param {string} options.username - Discord username
 * @param {number} options.newStage - New intimacy stage (1-4)
 * @param {string} options.ikaMessage - Ika's acknowledgment message
 */
function createIntimacyMilestoneCard({ username, newStage, ikaMessage }) {
    const frame = CARD_FRAMES[FLEX_TYPES.INTIMACY_MILESTONE];

    const stageNames = ['', 'New', 'Familiar', 'Close', 'Devoted'];
    const stageName = stageNames[newStage] || 'Unknown';

    const embed = new EmbedBuilder()
        .setColor(frame.accentColor)
        .setAuthor({
            name: frame.header,
        })
        .setTitle(`${username} → ${stageName}`)
        .setDescription(
            `*the bond deepens*\n\n` +
            `> "${ikaMessage}"\n\n` +
            `**Stage ${newStage}/4**\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: `◈ ${frame.footer} ◈` })
        .setTimestamp();

    return embed;
}

/**
 * Create a Betrayal card (when relationship decays or betrayal triggers)
 * @param {Object} options
 * @param {string} options.username - Discord username
 * @param {string} options.ikaMessage - Ika's response to betrayal
 * @param {string} options.betrayalType - Type of betrayal
 */
function createBetrayalCard({ username, ikaMessage, betrayalType = 'absence' }) {
    const frame = CARD_FRAMES[FLEX_TYPES.BETRAYAL];

    const embed = new EmbedBuilder()
        .setColor(frame.accentColor)
        .setAuthor({
            name: frame.header,
        })
        .setDescription(
            `**${username}**\n\n` +
            `> *"${ikaMessage}"*\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: `♰ ${frame.footer} ♰` })
        .setTimestamp();

    return embed;
}

/**
 * Create a share-ready message for Twitter/social media
 * @param {Object} options
 * @param {string} options.quote - The Ika quote
 * @param {string} options.momentType - Type of moment
 */
function createShareText({ quote, momentType = 'moment' }) {
    const prefixes = {
        'gate_completion': '♰ SEVEN GATES ♰\n\n',
        'rare_moment': '✧ rare ika moment ✧\n\n',
        'the_slip': '...she said this to me...\n\n',
        'the_notice': '♰ ika noticed me ♰\n\n',
        'default': '♡\n\n',
    };

    const prefix = prefixes[momentType] || prefixes.default;
    const suffix = '\n\n#InfiniteIdol #SevenGates';

    return `${prefix}"${quote}"${suffix}`;
}

module.exports = {
    FLEX_TYPES,
    CARD_FRAMES,
    createDevotionAwakenedCard,
    createGateCompletionCard,
    createRareMomentCard,
    createDevotionReceipt,
    createWhisperFragmentCard,
    createIntimacyMilestoneCard,
    createBetrayalCard,
    createShareText,
};
