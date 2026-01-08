/**
 * Gate 1: The Calling
 *
 * Triggered when user says "ika" in the waiting room.
 * Handled directly in messageCreate.js event.
 *
 * This file exports helper functions for Gate 1.
 */

const config = require('../config');
const { userOps } = require('../database');
const { assignGateRole } = require('../utils/roles');

/**
 * Check if user has completed Gate 1
 */
function hasCompletedGate1(discordId) {
    return userOps.hasCompletedGate(discordId, 1);
}

/**
 * Complete Gate 1 for a user (used by admin commands)
 */
async function completeGate1(member) {
    // Ensure user exists in database
    userOps.getOrCreate(member.id, member.user.username);

    // Check if already completed
    if (hasCompletedGate1(member.id)) {
        return { success: false, reason: 'already_completed' };
    }

    // Assign role
    const roleAssigned = await assignGateRole(member, 1);
    if (!roleAssigned) {
        return { success: false, reason: 'role_failed' };
    }

    // Complete in database
    const result = userOps.completeGate(member.id, 1);

    return {
        success: true,
        isFirst: result.isFirst,
    };
}

module.exports = {
    hasCompletedGate1,
    completeGate1,
};
