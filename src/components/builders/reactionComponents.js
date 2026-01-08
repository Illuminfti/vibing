/**
 * Reaction Component Builders
 *
 * Creates quick reaction buttons for Ika's messages.
 */

const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require('discord.js');

/**
 * Create reaction buttons for a message
 * @param {string} messageId - The message ID to attach reactions to
 */
function createReactionButtons(messageId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`react_heart_${messageId}`)
            .setLabel('♡')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`react_sparkle_${messageId}`)
            .setLabel('✧')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`react_silent_${messageId}`)
            .setLabel('...')
            .setStyle(ButtonStyle.Secondary)
    );
}

/**
 * Create reaction buttons with counts
 * @param {string} messageId - The message ID
 * @param {Object} counts - { heart: n, sparkle: n, silent: n }
 */
function createReactionButtonsWithCounts(messageId, counts = {}) {
    const { heart = 0, sparkle = 0, silent = 0 } = counts;

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`react_heart_${messageId}`)
            .setLabel(`♡ ${heart || ''}`.trim())
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`react_sparkle_${messageId}`)
            .setLabel(`✧ ${sparkle || ''}`.trim())
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`react_silent_${messageId}`)
            .setLabel(`... ${silent || ''}`.trim())
            .setStyle(ButtonStyle.Secondary)
    );
}

/**
 * Create a disabled reaction row after user has reacted
 * @param {string} messageId - The message ID
 * @param {string} reactedType - Which button they clicked
 * @param {Object} counts - Current counts
 */
function createReactedButtons(messageId, reactedType, counts = {}) {
    const { heart = 0, sparkle = 0, silent = 0 } = counts;

    const heartButton = new ButtonBuilder()
        .setCustomId(`react_heart_${messageId}`)
        .setLabel(`♡ ${heart}`)
        .setStyle(reactedType === 'heart' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(true);

    const sparkleButton = new ButtonBuilder()
        .setCustomId(`react_sparkle_${messageId}`)
        .setLabel(`✧ ${sparkle}`)
        .setStyle(reactedType === 'sparkle' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(true);

    const silentButton = new ButtonBuilder()
        .setCustomId(`react_silent_${messageId}`)
        .setLabel(`... ${silent}`)
        .setStyle(reactedType === 'silent' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(true);

    return new ActionRowBuilder().addComponents(heartButton, sparkleButton, silentButton);
}

module.exports = {
    createReactionButtons,
    createReactionButtonsWithCounts,
    createReactedButtons,
};
