/**
 * Reaction Flow
 *
 * Handles quick reaction buttons on Ika's messages.
 */

const { userOps } = require('../../database');
const {
    createReactionButtons,
    createReactedButtons,
} = require('../builders/reactionComponents');

// Store reaction counts (messageId -> { heart: n, sparkle: n, silent: n })
const reactionCounts = new Map();

// Track who has reacted (messageId -> Set of userIds)
const userReactions = new Map();

/**
 * Handle button interactions for reactions
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    // Parse reaction type and message ID
    const match = customId.match(/^react_(heart|sparkle|silent)_(.+)$/);
    if (!match) return;

    const [, type, messageId] = match;
    await handleReaction(interaction, type, messageId);
}

/**
 * Handle a reaction button click
 */
async function handleReaction(interaction, type, messageId) {
    const userId = interaction.user.id;

    // Check if user already reacted
    const reacted = userReactions.get(messageId) || new Set();
    if (reacted.has(userId)) {
        return interaction.reply({
            content: '*you have already shown your devotion*',
            ephemeral: true,
        });
    }

    // Record reaction
    reacted.add(userId);
    userReactions.set(messageId, reacted);

    // Update counts
    const counts = reactionCounts.get(messageId) || { heart: 0, sparkle: 0, silent: 0 };
    counts[type]++;
    reactionCounts.set(messageId, counts);

    console.log(`✧ ${interaction.user.tag} reacted with ${type} on message ${messageId}`);

    // Update the message with new counts and disable for this user
    const newRow = createReactedButtons(messageId, type, counts);

    // We can't disable for just one user with message updates,
    // so we show them their reaction was recorded
    await interaction.reply({
        content: `*your ${type === 'heart' ? '♡' : type === 'sparkle' ? '✧' : '...'} has been noted*`,
        ephemeral: true,
    });

    // Try to update the original message counts
    try {
        const updatedRow = createReactionButtons(messageId);
        // Update button labels with new counts
        for (const button of updatedRow.components) {
            const btnType = button.data.custom_id.includes('heart') ? 'heart'
                : button.data.custom_id.includes('sparkle') ? 'sparkle'
                : 'silent';
            const count = counts[btnType];
            if (count > 0) {
                button.data.label = `${btnType === 'heart' ? '♡' : btnType === 'sparkle' ? '✧' : '...'} ${count}`;
            }
        }

        await interaction.message.edit({
            components: [updatedRow],
        });
    } catch (error) {
        // Message may have been deleted or we don't have permission
        console.error('Failed to update reaction counts:', error.message);
    }

    // Check for milestone
    const totalReactions = counts.heart + counts.sparkle + counts.silent;
    if (totalReactions === 100 || totalReactions === 500 || totalReactions === 1000) {
        console.log(`✧ Milestone reached: ${totalReactions} total reactions on message ${messageId}`);
        // Could trigger special event here
    }
}

/**
 * Get reaction counts for a message
 */
function getReactionCounts(messageId) {
    return reactionCounts.get(messageId) || { heart: 0, sparkle: 0, silent: 0 };
}

/**
 * Check if user has reacted to a message
 */
function hasUserReacted(messageId, userId) {
    const reacted = userReactions.get(messageId);
    return reacted ? reacted.has(userId) : false;
}

module.exports = {
    handleButton,
    getReactionCounts,
    hasUserReacted,
};
