/**
 * Data Archival & Cleanup System
 *
 * Manages database size by:
 * - Archiving inactive user data
 * - Cleaning up old logs and temporary data
 * - Compacting JSON fields
 * - Pruning stale records
 *
 * @version 3.3.0
 */

// Allowlist for memory columns that can be updated dynamically
const ALLOWED_ARCHIVAL_COLUMNS = new Set([
    'remembered_facts',
    'inside_jokes',
    'notable_moments',
    'growth_milestones_hit',
]);

// ═══════════════════════════════════════════════════════════════
// ARCHIVAL THRESHOLDS
// ═══════════════════════════════════════════════════════════════

const THRESHOLDS = {
    // Users inactive for 90 days get archived
    userInactiveDays: 90,

    // DM logs older than 30 days get pruned
    dmLogDays: 30,

    // Presence events older than 7 days get pruned
    presenceEventDays: 7,

    // Rare events older than 60 days get pruned
    rareEventDays: 60,

    // Ika messages older than 14 days get pruned
    ikaMessageDays: 14,

    // Keep only last 100 Ika moments
    ikaMomentLimit: 100,

    // Maximum JSON array sizes in ika_memory
    maxRememberedFacts: 10,
    maxInsideJokes: 5,
    maxNotableMoments: 10,
    maxGrowthMilestones: 20,
};

// ═══════════════════════════════════════════════════════════════
// ARCHIVAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Archive inactive users to separate table
 * Moves data to archive table and removes from main tables
 */
function archiveInactiveUsers(db) {
    const threshold = new Date(
        Date.now() - THRESHOLDS.userInactiveDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // Create archive table if not exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS archived_users (
            discord_id TEXT PRIMARY KEY,
            username TEXT,
            archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            original_data TEXT,
            memory_data TEXT,
            gate_progress INTEGER
        );
    `);

    // Find inactive users who haven't ascended
    const inactiveUsers = db.prepare(`
        SELECT u.*, m.* FROM users u
        LEFT JOIN ika_memory m ON u.discord_id = m.user_id
        WHERE u.last_activity_at < ?
        AND u.ascended_at IS NULL
        AND u.gate_7_at IS NULL
    `).all(threshold);

    let archived = 0;

    for (const user of inactiveUsers) {
        try {
            // Calculate gate progress
            let gateProgress = 0;
            for (let i = 1; i <= 7; i++) {
                if (user[`gate_${i}_at`]) gateProgress = i;
            }

            // Archive user data
            db.prepare(`
                INSERT OR REPLACE INTO archived_users
                (discord_id, username, original_data, memory_data, gate_progress)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                user.discord_id,
                user.username,
                JSON.stringify(user),
                user.user_id ? JSON.stringify({
                    remembered_facts: user.remembered_facts,
                    inside_jokes: user.inside_jokes,
                    relationship_level: user.relationship_level,
                    intimacy_stage: user.intimacy_stage,
                }) : null,
                gateProgress
            );

            // Remove from main tables
            db.prepare('DELETE FROM users WHERE discord_id = ?').run(user.discord_id);
            db.prepare('DELETE FROM ika_memory WHERE user_id = ?').run(user.discord_id);
            db.prepare('DELETE FROM gate5_schedule WHERE discord_id = ?').run(user.discord_id);
            db.prepare('DELETE FROM fragments WHERE discord_id = ?').run(user.discord_id);
            db.prepare('DELETE FROM fading_state WHERE user_id = ?').run(user.discord_id);
            db.prepare('DELETE FROM dm_cooldowns WHERE user_id = ?').run(user.discord_id);
            db.prepare('DELETE FROM dm_preferences WHERE user_id = ?').run(user.discord_id);

            archived++;
        } catch (error) {
            console.error(`Failed to archive user ${user.discord_id}:`, error.message);
        }
    }

    return { archived, checked: inactiveUsers.length };
}

/**
 * Restore archived user (when they return)
 */
function restoreArchivedUser(db, discordId) {
    const archived = db.prepare(`
        SELECT * FROM archived_users WHERE discord_id = ?
    `).get(discordId);

    if (!archived) return null;

    try {
        const userData = JSON.parse(archived.original_data);
        const memoryData = archived.memory_data ? JSON.parse(archived.memory_data) : null;

        // Restore to users table
        const userColumns = Object.keys(userData).filter(k =>
            !k.startsWith('user_id') && !k.startsWith('remembered_') &&
            !k.startsWith('inside_') && !k.startsWith('notable_') &&
            !k.startsWith('relationship_') && !k.startsWith('intimacy_')
        );

        // Simple restore - just recreate the user
        db.prepare('INSERT INTO users (discord_id, username) VALUES (?, ?)')
            .run(userData.discord_id, userData.username);

        // Restore memory if exists
        if (memoryData) {
            db.prepare(`
                INSERT INTO ika_memory (user_id, username, remembered_facts, inside_jokes, relationship_level, intimacy_stage)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                discordId,
                userData.username,
                memoryData.remembered_facts || '[]',
                memoryData.inside_jokes || '[]',
                memoryData.relationship_level || 'new',
                memoryData.intimacy_stage || 1
            );
        }

        // Remove from archive
        db.prepare('DELETE FROM archived_users WHERE discord_id = ?').run(discordId);

        return { restored: true, gateProgress: archived.gate_progress };
    } catch (error) {
        console.error(`Failed to restore user ${discordId}:`, error.message);
        return null;
    }
}

/**
 * Check if user is archived
 */
function isUserArchived(db, discordId) {
    const archived = db.prepare(`
        SELECT discord_id FROM archived_users WHERE discord_id = ?
    `).get(discordId);
    return !!archived;
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Prune old DM logs
 */
function pruneDmLogs(db) {
    const threshold = new Date(
        Date.now() - THRESHOLDS.dmLogDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = db.prepare(`
        DELETE FROM dm_log WHERE timestamp < ?
    `).run(threshold);

    return result.changes;
}

/**
 * Prune old presence events
 */
function prunePresenceEvents(db) {
    const threshold = new Date(
        Date.now() - THRESHOLDS.presenceEventDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = db.prepare(`
        DELETE FROM presence_events WHERE detected_at < ?
    `).run(threshold);

    return result.changes;
}

/**
 * Prune old rare events
 */
function pruneRareEvents(db) {
    const threshold = new Date(
        Date.now() - THRESHOLDS.rareEventDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = db.prepare(`
        DELETE FROM rare_events WHERE triggered_at < ?
    `).run(threshold);

    return result.changes;
}

/**
 * Prune old Ika messages
 */
function pruneIkaMessages(db) {
    const threshold = new Date(
        Date.now() - THRESHOLDS.ikaMessageDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = db.prepare(`
        DELETE FROM ika_messages WHERE timestamp < ?
    `).run(threshold);

    return result.changes;
}

/**
 * Prune old Ika moments (keep only recent)
 */
function pruneIkaMoments(db) {
    // Get count
    const count = db.prepare('SELECT COUNT(*) as count FROM ika_moments').get().count;

    if (count <= THRESHOLDS.ikaMomentLimit) return 0;

    // Delete oldest entries
    const toDelete = count - THRESHOLDS.ikaMomentLimit;
    const result = db.prepare(`
        DELETE FROM ika_moments WHERE id IN (
            SELECT id FROM ika_moments ORDER BY timestamp ASC LIMIT ?
        )
    `).run(toDelete);

    return result.changes;
}

/**
 * Compact JSON arrays in ika_memory
 */
function compactMemoryArrays(db) {
    const memories = db.prepare('SELECT user_id, remembered_facts, inside_jokes, notable_moments, growth_milestones_hit FROM ika_memory').all();

    let compacted = 0;

    for (const memory of memories) {
        let needsUpdate = false;
        const updates = {};

        // Compact remembered_facts
        try {
            const facts = JSON.parse(memory.remembered_facts || '[]');
            if (facts.length > THRESHOLDS.maxRememberedFacts) {
                updates.remembered_facts = JSON.stringify(facts.slice(-THRESHOLDS.maxRememberedFacts));
                needsUpdate = true;
            }
        } catch { /* ignore parse errors */ }

        // Compact inside_jokes
        try {
            const jokes = JSON.parse(memory.inside_jokes || '[]');
            if (jokes.length > THRESHOLDS.maxInsideJokes) {
                updates.inside_jokes = JSON.stringify(jokes.slice(-THRESHOLDS.maxInsideJokes));
                needsUpdate = true;
            }
        } catch { /* ignore */ }

        // Compact notable_moments
        try {
            const moments = JSON.parse(memory.notable_moments || '[]');
            if (moments.length > THRESHOLDS.maxNotableMoments) {
                updates.notable_moments = JSON.stringify(moments.slice(-THRESHOLDS.maxNotableMoments));
                needsUpdate = true;
            }
        } catch { /* ignore */ }

        // Compact growth_milestones
        try {
            const milestones = JSON.parse(memory.growth_milestones_hit || '[]');
            if (milestones.length > THRESHOLDS.maxGrowthMilestones) {
                updates.growth_milestones_hit = JSON.stringify(milestones.slice(-THRESHOLDS.maxGrowthMilestones));
                needsUpdate = true;
            }
        } catch { /* ignore */ }

        if (needsUpdate) {
            // Security: Validate all column names against allowlist
            const validUpdates = {};
            for (const [key, value] of Object.entries(updates)) {
                if (ALLOWED_ARCHIVAL_COLUMNS.has(key)) {
                    validUpdates[key] = value;
                } else {
                    console.error(`Security: Rejected invalid column in archival: ${key}`);
                }
            }

            if (Object.keys(validUpdates).length > 0) {
                const setClauses = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
                const values = [...Object.values(validUpdates), memory.user_id];

                db.prepare(`UPDATE ika_memory SET ${setClauses} WHERE user_id = ?`).run(...values);
                compacted++;
            }
        }
    }

    return compacted;
}

/**
 * Clean up orphaned records
 */
function cleanupOrphans(db) {
    let cleaned = 0;

    // Clean orphaned ika_memory records
    cleaned += db.prepare(`
        DELETE FROM ika_memory WHERE user_id NOT IN (SELECT discord_id FROM users)
    `).run().changes;

    // Clean orphaned fading_state records
    cleaned += db.prepare(`
        DELETE FROM fading_state WHERE user_id NOT IN (SELECT discord_id FROM users)
    `).run().changes;

    // Clean orphaned dm_cooldowns
    cleaned += db.prepare(`
        DELETE FROM dm_cooldowns WHERE user_id NOT IN (SELECT discord_id FROM users)
    `).run().changes;

    // Clean orphaned dm_preferences
    cleaned += db.prepare(`
        DELETE FROM dm_preferences WHERE user_id NOT IN (SELECT discord_id FROM users)
    `).run().changes;

    return cleaned;
}

// ═══════════════════════════════════════════════════════════════
// MAIN CLEANUP RUNNER
// ═══════════════════════════════════════════════════════════════

/**
 * Run full cleanup cycle
 * Returns stats on what was cleaned
 */
function runFullCleanup(db) {
    const stats = {
        startedAt: new Date().toISOString(),
        archived: 0,
        dmLogsPruned: 0,
        presenceEventsPruned: 0,
        rareEventsPruned: 0,
        ikaMessagesPruned: 0,
        ikaMomentsPruned: 0,
        memoriesCompacted: 0,
        orphansCleaned: 0,
    };

    try {
        // Archive inactive users
        const archiveResult = archiveInactiveUsers(db);
        stats.archived = archiveResult.archived;

        // Prune old logs
        stats.dmLogsPruned = pruneDmLogs(db);
        stats.presenceEventsPruned = prunePresenceEvents(db);
        stats.rareEventsPruned = pruneRareEvents(db);
        stats.ikaMessagesPruned = pruneIkaMessages(db);
        stats.ikaMomentsPruned = pruneIkaMoments(db);

        // Compact memory arrays
        stats.memoriesCompacted = compactMemoryArrays(db);

        // Clean orphans
        stats.orphansCleaned = cleanupOrphans(db);

        stats.completedAt = new Date().toISOString();
        stats.success = true;
    } catch (error) {
        stats.error = error.message;
        stats.success = false;
    }

    return stats;
}

/**
 * Get database size stats
 */
function getDatabaseStats(db) {
    return {
        users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        archivedUsers: db.prepare('SELECT COUNT(*) as count FROM archived_users').get()?.count || 0,
        ascendedUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE ascended_at IS NOT NULL').get().count,
        ikaMemories: db.prepare('SELECT COUNT(*) as count FROM ika_memory').get().count,
        ikaMessages: db.prepare('SELECT COUNT(*) as count FROM ika_messages').get().count,
        dmLogs: db.prepare('SELECT COUNT(*) as count FROM dm_log').get().count,
        presenceEvents: db.prepare('SELECT COUNT(*) as count FROM presence_events').get().count,
    };
}

module.exports = {
    THRESHOLDS,
    archiveInactiveUsers,
    restoreArchivedUser,
    isUserArchived,
    pruneDmLogs,
    prunePresenceEvents,
    pruneRareEvents,
    pruneIkaMessages,
    pruneIkaMoments,
    compactMemoryArrays,
    cleanupOrphans,
    runFullCleanup,
    getDatabaseStats,
};
