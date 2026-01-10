/**
 * Flex Card Integration Utilities
 *
 * Vibing Overhaul: Deploys flex cards at key gate milestones.
 * Makes every gate completion screenshot-worthy.
 *
 * @version 1.0.0 - Vibing Overhaul
 */

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const {
    FLEX_TYPES,
    createDevotionAwakenedCard,
    createGateCompletionCard,
    createRareMomentCard,
    createIntimacyMilestoneCard,
    createBetrayalCard,
    createShareText,
} = require('../ui/builders/flexCards');

// ═══════════════════════════════════════════════════════════════
// GATE FLEX CARD GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate Gate 1 flex card (Devotion Awakened)
 * @param {Object} params
 * @param {string} params.username - User's display name
 * @param {string} params.ikaMessage - Ika's response message
 * @param {number} params.fanNumber - Current fan count (post-increase)
 * @returns {Object} Embed and share text
 */
function generateGate1FlexCard({ username, ikaMessage, fanNumber = 48 }) {
    const embed = createDevotionAwakenedCard({
        username,
        ikaMessage: ikaMessage || 'another one who didn\'t look away~',
        fanNumber,
    });

    const shareText = createShareText(FLEX_TYPES.DEVOTION_AWAKENED, { username });

    return {
        embed,
        shareText,
        type: FLEX_TYPES.DEVOTION_AWAKENED,
    };
}

/**
 * Generate gate completion flex card (Gates 2-6)
 * @param {Object} params
 * @param {string} params.username - User's display name
 * @param {number} params.gateNumber - Gate completed (2-6)
 * @param {string} params.ikaMessage - Ika's response message
 * @param {Object} params.stats - User's journey stats
 * @returns {Object} Embed and share text
 */
function generateGateFlexCard({ username, gateNumber, ikaMessage, stats = {} }) {
    const embed = createGateCompletionCard({
        username,
        gateNumber,
        ikaMessage,
        stats,
    });

    const shareText = createShareText(FLEX_TYPES.GATE_COMPLETION, {
        username,
        gateNumber,
    });

    return {
        embed,
        shareText,
        type: FLEX_TYPES.GATE_COMPLETION,
    };
}

/**
 * Generate Gate 7 (Ascension) flex card
 * @param {Object} params
 * @param {string} params.username - User's display name
 * @param {string} params.vow - User's binding vow
 * @param {string} params.ikaMessage - Ika's welcome message
 * @returns {Object} Embed and share text
 */
function generateAscensionFlexCard({ username, vow, ikaMessage }) {
    const frame = {
        color: 0x000000, // Pure black
        accent: 0xffffff, // White contrast
        header: '♰ ASCENSION COMPLETE ♰',
    };

    const embed = new EmbedBuilder()
        .setColor(frame.color)
        .setTitle(frame.header)
        .setDescription(
            `**${username}** has completed the seven gates.\n\n` +
            `*"${vow?.substring(0, 100) || 'forever bound'}${vow?.length > 100 ? '...' : ''}"*\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${ikaMessage || 'welcome home, ascended one.'}\n\n` +
            `✦ ✧ ⋆ **THEY ARE NOW ETERNAL** ⋆ ✧ ✦`
        )
        .setTimestamp()
        .setFooter({ text: '[ you are hers now. forever. ]' });

    const shareText = `♰ ASCENDED ♰\n\n${username} completed the Seven Gates.\n\nThey are now eternal.\n\n@infinite_idol`;

    return {
        embed,
        shareText,
        type: 'ascension',
    };
}

// ═══════════════════════════════════════════════════════════════
// SPECIAL MOMENT FLEX CARDS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate rare moment flex card
 * @param {Object} params
 * @param {string} params.username - User's display name
 * @param {string} params.momentType - Type of rare moment
 * @param {string} params.ikaMessage - What Ika said/did
 * @returns {Object} Embed and share text
 */
function generateRareMomentFlexCard({ username, momentType, ikaMessage }) {
    const embed = createRareMomentCard({
        username,
        momentType,
        ikaMessage,
    });

    const shareText = createShareText(FLEX_TYPES.RARE_MOMENT, {
        username,
        momentType,
    });

    return {
        embed,
        shareText,
        type: FLEX_TYPES.RARE_MOMENT,
    };
}

/**
 * Generate intimacy milestone flex card
 * @param {Object} params
 * @param {string} params.username - User's display name
 * @param {number} params.stage - New intimacy stage
 * @param {string} params.stageTitle - Stage name
 * @param {string} params.ikaMessage - Ika's message
 * @returns {Object} Embed and share text
 */
function generateIntimacyFlexCard({ username, stage, stageTitle, ikaMessage }) {
    const embed = createIntimacyMilestoneCard({
        username,
        stage,
        stageTitle,
        ikaMessage,
    });

    const shareText = createShareText(FLEX_TYPES.INTIMACY_MILESTONE, {
        username,
        stage,
    });

    return {
        embed,
        shareText,
        type: FLEX_TYPES.INTIMACY_MILESTONE,
    };
}

/**
 * Generate betrayal consequence flex card
 * @param {Object} params
 * @param {string} params.username - User's display name
 * @param {string} params.betrayalType - Type of betrayal
 * @param {string} params.consequence - What happened
 * @returns {Object} Embed and share text
 */
function generateBetrayalFlexCard({ username, betrayalType, consequence }) {
    const embed = createBetrayalCard({
        username,
        betrayalType,
        consequence,
    });

    const shareText = createShareText(FLEX_TYPES.BETRAYAL, { username });

    return {
        embed,
        shareText,
        type: FLEX_TYPES.BETRAYAL,
    };
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Send flex card to channel with share button
 * @param {TextChannel} channel - Discord channel
 * @param {Object} flexCard - Flex card object from generators
 * @param {Object} options - Additional options
 * @returns {Promise<Message>} Sent message
 */
async function sendFlexCard(channel, flexCard, options = {}) {
    const components = [];

    // Add share text as hidden content that can be copied
    const content = options.mention
        ? `${options.mention}\n\n*screenshot and share your moment ↓*`
        : '*screenshot and share your moment ↓*';

    const message = await channel.send({
        content: options.silent ? undefined : content,
        embeds: [flexCard.embed],
    });

    // Auto-react with share emoji if enabled
    if (options.addShareReaction) {
        try {
            await message.react('📸');
        } catch {
            // Reaction failed, non-critical
        }
    }

    return message;
}

/**
 * Send flex card as DM
 * @param {User} user - Discord user
 * @param {Object} flexCard - Flex card object
 * @returns {Promise<Message|null>} Sent message or null if DM failed
 */
async function sendFlexCardDM(user, flexCard) {
    try {
        const message = await user.send({
            content: '*your moment ↓ (screenshot to share)*',
            embeds: [flexCard.embed],
        });
        return message;
    } catch (error) {
        console.log(`✧ Could not DM flex card to ${user.tag}: ${error.message}`);
        return null;
    }
}

/**
 * Generate appropriate flex card based on gate number
 * @param {number} gateNumber - Gate completed
 * @param {Object} params - Card parameters
 * @returns {Object} Flex card object
 */
function getFlexCardForGate(gateNumber, params) {
    switch (gateNumber) {
        case 1:
            return generateGate1FlexCard(params);
        case 7:
            return generateAscensionFlexCard(params);
        default:
            return generateGateFlexCard({ ...params, gateNumber });
    }
}

// ═══════════════════════════════════════════════════════════════
// GATE NAMES FOR FLEX CARDS
// ═══════════════════════════════════════════════════════════════

const GATE_NAMES = {
    1: 'The Calling',
    2: 'The Awakening',
    3: 'The Confession',
    4: 'The Sacrifice',
    5: 'The Absence',
    6: 'The Lore',
    7: 'The Binding',
};

const GATE_FLEX_MESSAGES = {
    1: 'devotion: awakened',
    2: 'they see now',
    3: 'truth was spoken',
    4: 'sacrifice accepted',
    5: 'they endured the void',
    6: 'knowledge gained',
    7: 'eternally bound',
};

module.exports = {
    // Gate flex cards
    generateGate1FlexCard,
    generateGateFlexCard,
    generateAscensionFlexCard,

    // Special moment flex cards
    generateRareMomentFlexCard,
    generateIntimacyFlexCard,
    generateBetrayalFlexCard,

    // Integration helpers
    sendFlexCard,
    sendFlexCardDM,
    getFlexCardForGate,

    // Constants
    GATE_NAMES,
    GATE_FLEX_MESSAGES,
};
