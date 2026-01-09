/**
 * Gate 4: Helper Functions
 *
 * Contains utility functions for Gate 4 that are used by other modules.
 * The main gate flow is handled by components/flows/gate4Flow.js
 */

const { userOps, gate5Ops } = require('../database');
const { getGate5Interval } = require('../utils/timing');

/**
 * Start Gate 5 timed sequence
 * Called after completing Gate 4 to begin the absence vigil
 */
function startGate5Sequence(discordId) {
    const interval = getGate5Interval();

    // Update database
    userOps.update(discordId, 'gate_5_started_at', new Date().toISOString());

    // Schedule all 6 messages
    gate5Ops.scheduleMessages(discordId, interval);

    console.log(`✧ started Gate 5 sequence for ${discordId} with ${interval}ms intervals`);
}

module.exports = {
    startGate5Sequence,
};
