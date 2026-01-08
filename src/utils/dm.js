/**
 * DM Fallback System
 *
 * Handles sending DMs with automatic fallback to channel messages
 * when DMs are not possible (user has DMs disabled, too many failures, etc.)
 *
 * This ensures all gate-related messages get delivered somehow.
 */

const { dmOps, dmPrefsOps } = require('../database');
const config = require('../config');

// Discord API error codes related to DMs
const DM_ERROR_CODES = {
    50007: 'Cannot send messages to this user',  // DMs disabled
    50013: 'Missing permissions',
    10003: 'Unknown channel',
    10013: 'Unknown user',
};

/**
 * Send a message to a user with automatic fallback
 * @param {Client} client - Discord client
 * @param {string} userId - Target user ID
 * @param {string|object} content - Message content or message options object
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Result with success status and method used
 */
async function sendToUser(client, userId, content, options = {}) {
    const {
        fallbackChannelId = null,
        dmType = 'general',
        forceChannel = false,
        attachments = [],
        allowFallback = true,
        mentionInFallback = true,
    } = options;

    // Check if we should even try DMs
    const dmStatus = dmOps.checkDMStatus(userId);

    if (dmStatus.shouldSkip || forceChannel) {
        // Go straight to fallback
        if (fallbackChannelId && allowFallback) {
            return await sendFallback(client, userId, content, fallbackChannelId, {
                mentionInFallback,
                attachments,
                dmType,
            });
        }
        return { success: false, method: 'none', reason: dmStatus.reason || 'Forced to channel, no fallback' };
    }

    // Try DM first
    try {
        const user = await client.users.fetch(userId);

        const messageOptions = typeof content === 'string'
            ? { content }
            : { ...content };

        if (attachments.length > 0) {
            messageOptions.files = [...(messageOptions.files || []), ...attachments];
        }

        await user.send(messageOptions);

        // Log success
        dmOps.logDMAttempt(userId, dmType, content, true);

        // Reset failure count on success
        dmOps.resetDMFailures(userId);

        return { success: true, method: 'dm' };

    } catch (error) {
        // Log failure
        dmOps.logDMAttempt(userId, dmType, content, false, error.code?.toString());

        // Increment failure count
        dmOps.incrementDMFailures(userId);

        // Check if this is a "DMs disabled" error
        if (error.code === 50007) {
            // Mark user as DMs disabled
            dmOps.markDMsDisabled(userId);
        }

        console.log(`✧ DM failed to ${userId}: ${DM_ERROR_CODES[error.code] || error.message}`);

        // Try fallback if available
        if (fallbackChannelId && allowFallback) {
            return await sendFallback(client, userId, content, fallbackChannelId, {
                mentionInFallback,
                attachments,
                dmType,
            });
        }

        return {
            success: false,
            method: 'none',
            error: DM_ERROR_CODES[error.code] || error.message,
        };
    }
}

/**
 * Send message to channel as fallback
 */
async function sendFallback(client, userId, content, channelId, options = {}) {
    const { mentionInFallback, attachments, dmType } = options;

    try {
        const channel = await client.channels.fetch(channelId);

        let messageContent = typeof content === 'string' ? content : content.content;

        // Add mention if requested
        if (mentionInFallback && messageContent) {
            messageContent = `<@${userId}>\n\n${messageContent}`;
        } else if (mentionInFallback) {
            messageContent = `<@${userId}>`;
        }

        const messageOptions = { content: messageContent };

        // Preserve embeds if present
        if (typeof content === 'object' && content.embeds) {
            messageOptions.embeds = content.embeds;
        }

        // Preserve files if present
        if (typeof content === 'object' && content.files) {
            messageOptions.files = [...content.files];
        }

        if (attachments && attachments.length > 0) {
            messageOptions.files = [...(messageOptions.files || []), ...attachments];
        }

        await channel.send(messageOptions);

        // Log that we used fallback
        dmOps.logDMAttempt(userId, dmType, content, true, null, true);

        return { success: true, method: 'channel_fallback', channelId };

    } catch (error) {
        console.error(`✧ Fallback also failed for ${userId}:`, error.message);
        return { success: false, method: 'none', error: error.message };
    }
}

/**
 * Check if user has opted into unprompted DMs
 * @param {string} userId - User ID
 * @returns {boolean}
 */
function canSendUnprompted(userId) {
    return dmPrefsOps.canSendUnprompted(userId);
}

/**
 * Get DM status for user (for debugging/display)
 * @param {string} userId - User ID
 * @returns {object}
 */
function getDMStatus(userId) {
    const status = dmOps.checkDMStatus(userId);
    const unprompted = canSendUnprompted(userId);

    return {
        canReceiveDMs: !status.shouldSkip,
        reason: status.reason,
        optedInToUnprompted: unprompted,
    };
}

/**
 * Send an unprompted DM (only if opted in)
 * @param {Client} client - Discord client
 * @param {string} userId - Target user ID
 * @param {string|object} content - Message content
 * @param {string} dmType - Type of unprompted DM
 * @returns {Promise<object>}
 */
async function sendUnpromptedDM(client, userId, content, dmType = 'unprompted') {
    // Check opt-in status
    if (!canSendUnprompted(userId)) {
        return { success: false, method: 'none', reason: 'User has not opted in to unprompted DMs' };
    }

    // Send without fallback - unprompted messages shouldn't go to public channels
    return await sendToUser(client, userId, content, {
        dmType,
        allowFallback: false,
    });
}

/**
 * Notify user that DMs failed and fallback was used
 * @param {Client} client - Discord client
 * @param {string} channelId - Channel to send notice in
 * @param {string} userId - User who couldn't receive DM
 */
async function notifyDMFallback(client, channelId, userId) {
    try {
        const channel = await client.channels.fetch(channelId);
        await channel.send(`<@${userId}> (i tried to dm you but couldn't. i'll talk to you here instead.)`);
    } catch (error) {
        console.error('✧ Could not send DM fallback notice:', error.message);
    }
}

module.exports = {
    DM_ERROR_CODES,
    sendToUser,
    sendFallback,
    canSendUnprompted,
    getDMStatus,
    sendUnpromptedDM,
    notifyDMFallback,
};
