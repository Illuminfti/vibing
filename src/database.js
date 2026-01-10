const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'seven_gates.db'));

// Initialize tables
db.exec(`
    -- Users table: tracks progress through gates
    CREATE TABLE IF NOT EXISTS users (
        discord_id TEXT PRIMARY KEY,
        username TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        -- Gate completion timestamps (NULL = not completed)
        gate_1_at DATETIME,
        gate_2_at DATETIME,
        gate_2_answer TEXT,
        gate_3_at DATETIME,
        gate_3_url TEXT,
        gate_4_at DATETIME,
        gate_5_started_at DATETIME,
        gate_5_messages_sent INTEGER DEFAULT 0,
        gate_5_at DATETIME,
        gate_5_reason TEXT,
        gate_6_at DATETIME,
        gate_6_type TEXT,
        gate_6_content TEXT,
        gate_6_approved_by TEXT,
        gate_7_at DATETIME,
        gate_7_vow TEXT,
        gate_7_approved_by TEXT,

        -- Tracking
        ascended_at DATETIME,
        total_time_seconds INTEGER,

        -- Idle tracking
        last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        idle_warning_sent INTEGER DEFAULT 0,

        -- DM LIMITATIONS FIX: DM tracking
        dms_work INTEGER DEFAULT 1,
        gate_dm_failures INTEGER DEFAULT 0,

        -- REFERRAL SYSTEM (P0-6): Viral tracking
        referred_by TEXT,
        invite_count INTEGER DEFAULT 0,
        invite_code TEXT UNIQUE,

        -- P1: Progressive hint system for puzzle gates
        gate_2_attempts INTEGER DEFAULT 0,
        gate_4_attempts INTEGER DEFAULT 0
    );

    -- Track first completions for each gate
    CREATE TABLE IF NOT EXISTS firsts (
        gate_number INTEGER PRIMARY KEY,
        discord_id TEXT,
        username TEXT,
        completed_at DATETIME
    );

    -- Archive all offerings
    CREATE TABLE IF NOT EXISTS offerings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT,
        username TEXT,
        type TEXT,
        content TEXT,
        message_id TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved INTEGER DEFAULT 0,
        approved_by TEXT,
        approved_at DATETIME
    );

    -- Archive all vows
    CREATE TABLE IF NOT EXISTS vows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT,
        username TEXT,
        vow TEXT,
        message_id TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved INTEGER DEFAULT 0,
        approved_by TEXT,
        approved_at DATETIME
    );

    -- Gate 5 scheduled messages
    CREATE TABLE IF NOT EXISTS gate5_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT,
        message_number INTEGER,
        scheduled_for DATETIME,
        sent INTEGER DEFAULT 0,
        sent_at DATETIME
    );

    -- Fragment DMs scheduled after gate completions
    CREATE TABLE IF NOT EXISTS fragments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT,
        gate_number INTEGER,
        scheduled_for DATETIME,
        sent INTEGER DEFAULT 0,
        sent_at DATETIME
    );

    -- Ika's memory of each person
    CREATE TABLE IF NOT EXISTS ika_memory (
        user_id TEXT PRIMARY KEY,
        username TEXT,

        -- Key journey info (cached from users table)
        why_they_came TEXT,
        their_vow TEXT,
        their_memory_answer TEXT,

        -- Relationship tracking
        interaction_count INTEGER DEFAULT 0,
        last_interaction DATETIME,
        relationship_level TEXT DEFAULT 'new',

        -- Remembered details (JSON arrays)
        remembered_facts TEXT DEFAULT '[]',
        inside_jokes TEXT DEFAULT '[]',
        nickname TEXT,

        -- Sentiment
        last_mood_with_them TEXT,
        notable_moments TEXT DEFAULT '[]',

        -- NEW: Viral optimization fields
        intimacy_stage INTEGER DEFAULT 1,
        first_interaction_at DATETIME,
        jealousy_mentions INTEGER DEFAULT 0,
        roast_count INTEGER DEFAULT 0,
        protection_moments INTEGER DEFAULT 0,
        growth_milestones_hit TEXT DEFAULT '[]',

        -- CRAZY FEATURES: Additional fields
        real_name TEXT,
        real_name_learned_at DATETIME,
        handwritten_notes_sent INTEGER DEFAULT 0,
        last_presence_notice DATETIME,
        whisper_fragments_found INTEGER DEFAULT 0,

        -- DM LIMITATIONS FIX: DM capability tracking
        dms_enabled INTEGER DEFAULT 1,
        dm_failures INTEGER DEFAULT 0,
        last_dm_attempt DATETIME,
        unprompted_opt_in INTEGER DEFAULT 0,

        -- WAIFU EXPERIENCE SYSTEMS (v3.2.0)
        shrine TEXT DEFAULT '{}',
        yandere_stage INTEGER DEFAULT 1,
        betrayal_count INTEGER DEFAULT 0,
        betrayal_type TEXT,
        redemption_stage INTEGER DEFAULT 0,
        last_kabedon DATETIME,
        romance_heat INTEGER DEFAULT 0,
        forbidden_tier INTEGER DEFAULT 0,
        ritual_tokens TEXT DEFAULT '{}',

        -- DAILY ENGAGEMENT SYSTEM (P0-3)
        daily_streak INTEGER DEFAULT 0,
        last_daily_checkin DATE,
        total_daily_checkins INTEGER DEFAULT 0
    );

    -- Lore fragment tracking
    CREATE TABLE IF NOT EXISTS lore_discoveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        category TEXT,
        fragment_index INTEGER,
        discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category, fragment_index)
    );

    -- Secret phrase tracking
    CREATE TABLE IF NOT EXISTS secret_discoveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        trigger_phrase TEXT,
        discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, trigger_phrase)
    );

    -- Rare event log
    CREATE TABLE IF NOT EXISTS rare_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        event_type TEXT,
        message_content TEXT,
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Time secret tracking
    CREATE TABLE IF NOT EXISTS time_secrets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        secret_type TEXT,
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, secret_type)
    );

    -- Daily ritual participation
    CREATE TABLE IF NOT EXISTS ritual_participation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        ritual_type TEXT,
        participated_at DATE,
        UNIQUE(user_id, ritual_type, participated_at)
    );

    -- Ritual log (when rituals were triggered)
    CREATE TABLE IF NOT EXISTS ritual_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ritual_name TEXT,
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- === CRAZY FEATURES: New tables ===

    -- Unprompted DMs tracking
    CREATE TABLE IF NOT EXISTS unprompted_dms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        dm_type TEXT,
        content TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Whisper Hunt ARG: Fragment drops
    CREATE TABLE IF NOT EXISTS whisper_drops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fragment_id INTEGER,
        channel_id TEXT,
        message_id TEXT,
        dropped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        found INTEGER DEFAULT 0,
        found_by TEXT,
        found_at DATETIME
    );

    -- Whisper Hunt ARG: User discoveries
    CREATE TABLE IF NOT EXISTS whisper_found (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        fragment_id INTEGER,
        found_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, fragment_id)
    );

    -- Anniversary messages sent
    CREATE TABLE IF NOT EXISTS anniversaries_sent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        anniversary_type TEXT,
        days_count INTEGER,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, anniversary_type, days_count)
    );

    -- Presence events tracking
    CREATE TABLE IF NOT EXISTS presence_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        event_type TEXT,
        old_value TEXT,
        new_value TEXT,
        responded INTEGER DEFAULT 0,
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Daily DM cooldowns
    CREATE TABLE IF NOT EXISTS dm_cooldowns (
        user_id TEXT PRIMARY KEY,
        last_unprompted_dm DATETIME,
        dms_today INTEGER DEFAULT 0,
        last_reset DATE
    );

    -- === DM LIMITATIONS FIX: New tables ===

    -- DM attempt log for debugging
    CREATE TABLE IF NOT EXISTS dm_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        dm_type TEXT,
        content_preview TEXT,
        success INTEGER,
        fallback_used INTEGER DEFAULT 0,
        error_code TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Unprompted DM opt-in tracking
    CREATE TABLE IF NOT EXISTS dm_preferences (
        user_id TEXT PRIMARY KEY,
        unprompted_enabled INTEGER DEFAULT 0,
        opted_in_at DATETIME,
        opted_out_at DATETIME
    );

    -- Fragment delivery log
    CREATE TABLE IF NOT EXISTS fragment_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        gate_number INTEGER,
        delivered_via TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Referral tracking
    CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id TEXT NOT NULL,
        referred_id TEXT NOT NULL,
        referred_username TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        referral_completed BOOLEAN DEFAULT 0,
        UNIQUE(referred_id)
    );

    -- All of Ika's messages (for context/learning)
    CREATE TABLE IF NOT EXISTS ika_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT,
        trigger_user_id TEXT,
        trigger_content TEXT,
        response TEXT,
        response_type TEXT,
        mood TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Initiated moments log
    CREATE TABLE IF NOT EXISTS ika_moments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moment_type TEXT,
        content TEXT,
        responses_count INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ika's current state
    CREATE TABLE IF NOT EXISTS ika_state (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Archived users table (for inactive user data)
    CREATE TABLE IF NOT EXISTS archived_users (
        discord_id TEXT PRIMARY KEY,
        username TEXT,
        archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        original_data TEXT,
        memory_data TEXT,
        gate_progress INTEGER
    );

    -- === PERFORMANCE INDEXES (v3.3.0) ===

    -- User lookup indexes
    CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
    CREATE INDEX IF NOT EXISTS idx_users_ascended ON users(ascended_at) WHERE ascended_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_activity ON users(last_activity_at);

    -- Memory lookup indexes
    CREATE INDEX IF NOT EXISTS idx_memory_user ON ika_memory(user_id);
    CREATE INDEX IF NOT EXISTS idx_memory_intimacy ON ika_memory(intimacy_stage);
    CREATE INDEX IF NOT EXISTS idx_memory_relationship ON ika_memory(relationship_level);
    CREATE INDEX IF NOT EXISTS idx_memory_last_interaction ON ika_memory(last_interaction);

    -- Scheduled tasks indexes
    CREATE INDEX IF NOT EXISTS idx_gate5_pending ON gate5_schedule(sent, scheduled_for);
    CREATE INDEX IF NOT EXISTS idx_fragments_pending ON fragments(sent, scheduled_for);

    -- Discovery indexes
    CREATE INDEX IF NOT EXISTS idx_lore_user ON lore_discoveries(user_id);
    CREATE INDEX IF NOT EXISTS idx_secrets_user ON secret_discoveries(user_id);
    CREATE INDEX IF NOT EXISTS idx_whisper_user ON whisper_found(user_id);

    -- DM tracking indexes
    CREATE INDEX IF NOT EXISTS idx_dm_log_user ON dm_log(user_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_dm_prefs_enabled ON dm_preferences(unprompted_enabled);

    -- Referral indexes
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
    CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
`);

// ═══════════════════════════════════════════════════════════════
// SECURITY: Column allowlists to prevent SQL injection
// ═══════════════════════════════════════════════════════════════

const ALLOWED_USER_COLUMNS = new Set([
    'username', 'joined_at', 'gate_1_at', 'gate_2_at', 'gate_2_answer',
    'gate_3_at', 'gate_3_url', 'gate_4_at', 'gate_5_started_at',
    'gate_5_messages_sent', 'gate_5_at', 'gate_5_reason', 'gate_6_at',
    'gate_6_type', 'gate_6_content', 'gate_6_approved_by', 'gate_7_at',
    'gate_7_vow', 'gate_7_approved_by', 'ascended_at', 'total_time_seconds',
    'last_activity_at', 'idle_warning_sent', 'dms_work', 'gate_dm_failures',
]);

const ALLOWED_MEMORY_COLUMNS = new Set([
    'username', 'why_they_came', 'their_vow', 'their_memory_answer',
    'interaction_count', 'last_interaction', 'relationship_level',
    'remembered_facts', 'inside_jokes', 'nickname', 'last_mood_with_them',
    'notable_moments', 'intimacy_stage', 'first_interaction_at',
    'jealousy_mentions', 'roast_count', 'protection_moments',
    'growth_milestones_hit', 'real_name', 'real_name_learned_at',
    'handwritten_notes_sent', 'last_presence_notice', 'whisper_fragments_found',
    'dms_enabled', 'dm_failures', 'last_dm_attempt', 'unprompted_opt_in',
    'shrine', 'yandere_stage', 'betrayal_count', 'betrayal_type',
    'redemption_stage', 'last_kabedon', 'romance_heat', 'forbidden_tier',
    'ritual_tokens', 'daily_streak', 'last_daily_checkin', 'total_daily_checkins',
]);

/**
 * Validate column name against allowlist (SQL injection prevention)
 * @param {string} column - Column name to validate
 * @param {Set} allowlist - Set of allowed column names
 * @returns {boolean}
 */
function isValidColumn(column, allowlist) {
    if (typeof column !== 'string') return false;
    return allowlist.has(column);
}

// User operations
const userOps = {
    // Get or create user
    getOrCreate(discordId, username) {
        const existing = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
        if (existing) return existing;

        db.prepare('INSERT INTO users (discord_id, username) VALUES (?, ?)').run(discordId, username);
        return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
    },

    // Get user
    get(discordId) {
        return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
    },

    // Update user field (with SQL injection protection)
    update(discordId, field, value) {
        // SECURITY: Validate field name against allowlist
        if (!isValidColumn(field, ALLOWED_USER_COLUMNS)) {
            console.error(`Security: Rejected invalid column name in userOps.update: ${field}`);
            return false;
        }
        db.prepare(`UPDATE users SET ${field} = ? WHERE discord_id = ?`).run(value, discordId);
        return true;
    },

    // Complete a gate (with SQL injection protection)
    completeGate(discordId, gateNumber, extraData = {}) {
        // SECURITY: Validate gate number
        if (typeof gateNumber !== 'number' || gateNumber < 1 || gateNumber > 7) {
            console.error(`Security: Rejected invalid gate number: ${gateNumber}`);
            return { isFirst: false, error: 'invalid_gate' };
        }

        const timestamp = new Date().toISOString();
        const updates = [`gate_${gateNumber}_at = ?`];
        const values = [timestamp];

        // SECURITY: Validate all extraData keys against allowlist
        for (const [key, value] of Object.entries(extraData)) {
            if (!isValidColumn(key, ALLOWED_USER_COLUMNS)) {
                console.error(`Security: Rejected invalid column in completeGate: ${key}`);
                continue; // Skip invalid columns
            }
            updates.push(`${key} = ?`);
            values.push(value);
        }

        values.push(discordId);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE discord_id = ?`).run(...values);

        // Check if first completion
        const first = db.prepare('SELECT * FROM firsts WHERE gate_number = ?').get(gateNumber);
        if (!first) {
            const user = this.get(discordId);
            db.prepare('INSERT INTO firsts (gate_number, discord_id, username, completed_at) VALUES (?, ?, ?, ?)')
                .run(gateNumber, discordId, user.username, timestamp);
            return { isFirst: true };
        }
        return { isFirst: false };
    },

    // Check if user completed a gate
    hasCompletedGate(discordId, gateNumber) {
        const user = this.get(discordId);
        if (!user) return false;
        return user[`gate_${gateNumber}_at`] !== null;
    },

    // Get current gate (highest completed + 1)
    getCurrentGate(discordId) {
        const user = this.get(discordId);
        if (!user) return 0;

        for (let i = 7; i >= 1; i--) {
            if (user[`gate_${i}_at`]) return i + 1;
        }
        return user.gate_1_at ? 2 : 1;
    },

    // Mark as ascended
    ascend(discordId) {
        const user = this.get(discordId);
        if (!user || !user.gate_1_at) return;

        const now = new Date();
        const started = new Date(user.gate_1_at);
        const totalSeconds = Math.floor((now - started) / 1000);

        db.prepare('UPDATE users SET ascended_at = ?, total_time_seconds = ? WHERE discord_id = ?')
            .run(now.toISOString(), totalSeconds, discordId);
    },

    // Reset user
    reset(discordId) {
        db.prepare('DELETE FROM users WHERE discord_id = ?').run(discordId);
        db.prepare('DELETE FROM gate5_schedule WHERE discord_id = ?').run(discordId);
        db.prepare('DELETE FROM fragments WHERE discord_id = ?').run(discordId);
        db.prepare('DELETE FROM ika_memory WHERE user_id = ?').run(discordId);
    },

    // Update activity
    updateActivity(discordId) {
        db.prepare('UPDATE users SET last_activity_at = ?, idle_warning_sent = 0 WHERE discord_id = ?')
            .run(new Date().toISOString(), discordId);
    },

    // Get idle users who need warning
    getIdleUsers(thresholdMs) {
        const threshold = new Date(Date.now() - thresholdMs).toISOString();
        return db.prepare(`
            SELECT * FROM users
            WHERE last_activity_at < ?
            AND idle_warning_sent = 0
            AND ascended_at IS NULL
            AND gate_1_at IS NOT NULL
        `).all(threshold);
    },

    // Mark idle warning sent
    markIdleWarningSent(discordId) {
        db.prepare('UPDATE users SET idle_warning_sent = 1 WHERE discord_id = ?').run(discordId);
    },

    // Get all ascended users
    getAscended() {
        return db.prepare('SELECT * FROM users WHERE ascended_at IS NOT NULL').all();
    },

    // Get user's full journey for display
    getJourney(discordId) {
        const user = this.get(discordId);
        if (!user) return null;

        return {
            username: user.username,
            joinedAt: user.joined_at,
            gate1At: user.gate_1_at,
            memoryAnswer: user.gate_2_answer,
            confessionUrl: user.gate_3_url,
            gate4At: user.gate_4_at,
            whyTheyCame: user.gate_5_reason,
            offeringType: user.gate_6_type,
            offeringContent: user.gate_6_content,
            theirVow: user.gate_7_vow,
            ascendedAt: user.ascended_at,
            totalTime: user.total_time_seconds,
        };
    },

    // P1: Progressive hint system - Increment gate attempts
    incrementGateAttempts(userId, gateNumber) {
        if (gateNumber !== 2 && gateNumber !== 4) {
            console.error(`Invalid gate number for attempts tracking: ${gateNumber}`);
            return 0;
        }

        const columnName = `gate_${gateNumber}_attempts`;
        db.prepare(`UPDATE users SET ${columnName} = ${columnName} + 1 WHERE discord_id = ?`).run(userId);

        const user = this.get(userId);
        return user ? user[columnName] : 0;
    },

    // P1: Progressive hint system - Get gate attempts
    getGateAttempts(userId, gateNumber) {
        if (gateNumber !== 2 && gateNumber !== 4) {
            console.error(`Invalid gate number for attempts tracking: ${gateNumber}`);
            return 0;
        }

        const user = this.get(userId);
        const columnName = `gate_${gateNumber}_attempts`;
        return user ? (user[columnName] || 0) : 0;
    },

    // P1: Progressive hint system - Reset gate attempts on success
    resetGateAttempts(userId, gateNumber) {
        if (gateNumber !== 2 && gateNumber !== 4) {
            console.error(`Invalid gate number for attempts tracking: ${gateNumber}`);
            return false;
        }

        const columnName = `gate_${gateNumber}_attempts`;
        db.prepare(`UPDATE users SET ${columnName} = 0 WHERE discord_id = ?`).run(userId);
        return true;
    },

    // Get stats
    getStats() {
        const stats = {};
        for (let i = 1; i <= 7; i++) {
            stats[`gate${i}`] = db.prepare(`SELECT COUNT(*) as count FROM users WHERE gate_${i}_at IS NOT NULL`).get().count;
        }
        stats.ascended = db.prepare('SELECT COUNT(*) as count FROM users WHERE ascended_at IS NOT NULL').get().count;
        stats.total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        return stats;
    },

    // Get first completions
    getFirsts() {
        return db.prepare('SELECT * FROM firsts ORDER BY gate_number').all();
    },

    // Get average completion time
    getAverageTime() {
        const result = db.prepare('SELECT AVG(total_time_seconds) as avg FROM users WHERE ascended_at IS NOT NULL').get();
        return result.avg || 0;
    },

    // Get inactive ascended users (for re-engagement)
    getInactiveAscended(daysSinceActive = 7) {
        const threshold = new Date(Date.now() - daysSinceActive * 24 * 60 * 60 * 1000).toISOString();
        return db.prepare(`
            SELECT * FROM users
            WHERE ascended_at IS NOT NULL
            AND last_activity_at < ?
        `).all(threshold);
    },
};

// Gate 5 schedule operations
const gate5Ops = {
    // Schedule all messages for a user
    scheduleMessages(discordId, intervalMs) {
        const now = Date.now();
        for (let i = 1; i <= 6; i++) {
            const scheduledFor = new Date(now + (i - 1) * intervalMs).toISOString();
            db.prepare('INSERT INTO gate5_schedule (discord_id, message_number, scheduled_for) VALUES (?, ?, ?)')
                .run(discordId, i, scheduledFor);
        }
    },

    // Alias for scheduleMessages
    schedule(discordId, intervalMs) {
        return this.scheduleMessages(discordId, intervalMs);
    },

    // Get pending messages that should be sent
    getPendingMessages() {
        const now = new Date().toISOString();
        return db.prepare(`
            SELECT * FROM gate5_schedule
            WHERE sent = 0 AND scheduled_for <= ?
            ORDER BY scheduled_for
        `).all(now);
    },

    // Mark message as sent
    markSent(id) {
        db.prepare('UPDATE gate5_schedule SET sent = 1, sent_at = ? WHERE id = ?')
            .run(new Date().toISOString(), id);
    },

    // Get user's progress (returns object with messages_sent)
    getProgress(discordId) {
        const total = db.prepare('SELECT COUNT(*) as count FROM gate5_schedule WHERE discord_id = ?').get(discordId);
        if (!total || total.count === 0) return null; // Not in gate 5

        const sent = db.prepare('SELECT COUNT(*) as count FROM gate5_schedule WHERE discord_id = ? AND sent = 1').get(discordId);
        return {
            messages_sent: sent.count,
            total_scheduled: total.count,
        };
    },

    // Increment progress by marking next unsent message as sent
    incrementProgress(discordId) {
        const next = db.prepare(`
            SELECT id FROM gate5_schedule
            WHERE discord_id = ? AND sent = 0
            ORDER BY message_number
            LIMIT 1
        `).get(discordId);

        if (next) {
            this.markSent(next.id);
            return true;
        }
        return false;
    },

    // Check if all messages sent
    allMessagesSent(discordId) {
        const progress = this.getProgress(discordId);
        return progress && progress.messages_sent >= 6;
    },

    // Clear schedule for user
    clear(discordId) {
        db.prepare('DELETE FROM gate5_schedule WHERE discord_id = ?').run(discordId);
    },
};

// Fragment operations (between-gate DMs)
const fragmentOps = {
    // Schedule a fragment DM
    schedule(discordId, gateNumber, delayMs) {
        const scheduledFor = new Date(Date.now() + delayMs).toISOString();
        db.prepare('INSERT INTO fragments (discord_id, gate_number, scheduled_for) VALUES (?, ?, ?)')
            .run(discordId, gateNumber, scheduledFor);
    },

    // Get pending fragments
    getPending() {
        const now = new Date().toISOString();
        return db.prepare(`
            SELECT * FROM fragments
            WHERE sent = 0 AND scheduled_for <= ?
            ORDER BY scheduled_for
        `).all(now);
    },

    // Mark as sent
    markSent(id) {
        db.prepare('UPDATE fragments SET sent = 1, sent_at = ? WHERE id = ?')
            .run(new Date().toISOString(), id);
    },

    // Clear for user
    clear(discordId) {
        db.prepare('DELETE FROM fragments WHERE discord_id = ?').run(discordId);
    },
};

// Offering operations
const offeringOps = {
    create(discordId, username, type, content, messageId) {
        db.prepare('INSERT INTO offerings (discord_id, username, type, content, message_id) VALUES (?, ?, ?, ?, ?)')
            .run(discordId, username, type, content, messageId);
        return db.prepare('SELECT * FROM offerings WHERE message_id = ?').get(messageId);
    },

    approve(messageId, approvedBy) {
        db.prepare('UPDATE offerings SET approved = 1, approved_by = ?, approved_at = ? WHERE message_id = ?')
            .run(approvedBy, new Date().toISOString(), messageId);
        return db.prepare('SELECT * FROM offerings WHERE message_id = ?').get(messageId);
    },

    getByUser(discordId) {
        return db.prepare('SELECT * FROM offerings WHERE discord_id = ? ORDER BY submitted_at DESC').all(discordId);
    },

    getPending(discordId) {
        return db.prepare('SELECT * FROM offerings WHERE discord_id = ? AND approved = 0 ORDER BY submitted_at DESC LIMIT 1').get(discordId);
    },
};

// Vow operations
const vowOps = {
    create(discordId, username, vow, messageId) {
        db.prepare('INSERT INTO vows (discord_id, username, vow, message_id) VALUES (?, ?, ?, ?)')
            .run(discordId, username, vow, messageId);
        return db.prepare('SELECT * FROM vows WHERE message_id = ?').get(messageId);
    },

    approve(messageId, approvedBy) {
        db.prepare('UPDATE vows SET approved = 1, approved_by = ?, approved_at = ? WHERE message_id = ?')
            .run(approvedBy, new Date().toISOString(), messageId);
        return db.prepare('SELECT * FROM vows WHERE message_id = ?').get(messageId);
    },

    getByUser(discordId) {
        return db.prepare('SELECT * FROM vows WHERE discord_id = ? ORDER BY submitted_at DESC').all(discordId);
    },

    getPending(discordId) {
        return db.prepare('SELECT * FROM vows WHERE discord_id = ? AND approved = 0 ORDER BY submitted_at DESC LIMIT 1').get(discordId);
    },
};

// Ika memory operations
const ikaMemoryOps = {
    // Get or create memory for a user
    getOrCreate(userId, username) {
        const existing = db.prepare('SELECT * FROM ika_memory WHERE user_id = ?').get(userId);
        if (existing) {
            try {
                existing.remembered_facts = JSON.parse(existing.remembered_facts || '[]');
                existing.inside_jokes = JSON.parse(existing.inside_jokes || '[]');
                existing.notable_moments = JSON.parse(existing.notable_moments || '[]');
            } catch (e) {
                console.error(`Failed to parse ika_memory JSON for ${userId}:`, e);
                existing.remembered_facts = [];
                existing.inside_jokes = [];
                existing.notable_moments = [];
            }
            return existing;
        }

        db.prepare('INSERT INTO ika_memory (user_id, username) VALUES (?, ?)').run(userId, username);
        return this.get(userId);
    },

    // Get memory
    get(userId) {
        const memory = db.prepare('SELECT * FROM ika_memory WHERE user_id = ?').get(userId);
        if (!memory) return null;

        try {
            memory.remembered_facts = JSON.parse(memory.remembered_facts || '[]');
            memory.inside_jokes = JSON.parse(memory.inside_jokes || '[]');
            memory.notable_moments = JSON.parse(memory.notable_moments || '[]');
        } catch (e) {
            console.error(`Failed to parse ika_memory JSON for ${userId}:`, e);
            memory.remembered_facts = [];
            memory.inside_jokes = [];
            memory.notable_moments = [];
        }
        return memory;
    },

    // Update memory fields dynamically (with SQL injection protection)
    update(userId, fields) {
        if (!fields || Object.keys(fields).length === 0) return false;

        const setClauses = [];
        const values = [];

        // SECURITY: Validate all field keys against allowlist
        for (const [key, value] of Object.entries(fields)) {
            if (!isValidColumn(key, ALLOWED_MEMORY_COLUMNS)) {
                console.error(`Security: Rejected invalid column in ikaMemoryOps.update: ${key}`);
                continue; // Skip invalid columns
            }
            setClauses.push(`${key} = ?`);
            values.push(value);
        }

        // If no valid columns, abort
        if (setClauses.length === 0) {
            console.error('Security: No valid columns to update in ikaMemoryOps.update');
            return false;
        }

        values.push(userId);

        db.prepare(`
            UPDATE ika_memory
            SET ${setClauses.join(', ')}
            WHERE user_id = ?
        `).run(...values);
        return true;
    },

    // Update from user's journey (when they ascend)
    syncFromUser(userId) {
        const user = userOps.get(userId);
        if (!user) return;

        db.prepare(`
            UPDATE ika_memory
            SET why_they_came = ?,
                their_vow = ?,
                their_memory_answer = ?
            WHERE user_id = ?
        `).run(user.gate_5_reason, user.gate_7_vow, user.gate_2_answer, userId);
    },

    // Increment interaction count
    recordInteraction(userId) {
        db.prepare(`
            UPDATE ika_memory
            SET interaction_count = interaction_count + 1,
                last_interaction = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `).run(userId);

        // Check for relationship level upgrade
        const memory = this.get(userId);
        if (!memory) return;

        let newLevel = memory.relationship_level;
        if (memory.interaction_count >= 100 && memory.relationship_level !== 'devoted') {
            newLevel = 'devoted';
        } else if (memory.interaction_count >= 50 && ['new', 'familiar'].includes(memory.relationship_level)) {
            newLevel = 'close';
        } else if (memory.interaction_count >= 10 && memory.relationship_level === 'new') {
            newLevel = 'familiar';
        }

        if (newLevel !== memory.relationship_level) {
            db.prepare('UPDATE ika_memory SET relationship_level = ? WHERE user_id = ?').run(newLevel, userId);
            return newLevel; // Return new level for milestone notification
        }
        return null;
    },

    // Add a remembered fact
    rememberFact(userId, fact) {
        const memory = this.get(userId);
        if (!memory) return;

        const facts = memory.remembered_facts;
        facts.push({ fact, timestamp: Date.now() });

        // Keep only last 10 facts
        while (facts.length > 10) facts.shift();

        db.prepare('UPDATE ika_memory SET remembered_facts = ? WHERE user_id = ?')
            .run(JSON.stringify(facts), userId);
    },

    // Add an inside joke
    addInsideJoke(userId, joke) {
        const memory = this.get(userId);
        if (!memory) return;

        const jokes = memory.inside_jokes;
        jokes.push({ joke, timestamp: Date.now() });

        // Keep only last 5 jokes
        while (jokes.length > 5) jokes.shift();

        db.prepare('UPDATE ika_memory SET inside_jokes = ? WHERE user_id = ?')
            .run(JSON.stringify(jokes), userId);
    },

    // Set nickname
    setNickname(userId, nickname) {
        db.prepare('UPDATE ika_memory SET nickname = ? WHERE user_id = ?').run(nickname, userId);
    },

    // Record notable moment
    addNotableMoment(userId, description) {
        const memory = this.get(userId);
        if (!memory) return;

        const moments = memory.notable_moments;
        moments.push({ description, timestamp: Date.now() });

        // Keep only last 10 moments
        while (moments.length > 10) moments.shift();

        db.prepare('UPDATE ika_memory SET notable_moments = ? WHERE user_id = ?')
            .run(JSON.stringify(moments), userId);
    },

    // Get devotees with memory (for callbacks)
    getDevoteesWithMemory() {
        return db.prepare(`
            SELECT * FROM ika_memory
            WHERE why_they_came IS NOT NULL
            AND interaction_count > 5
            ORDER BY RANDOM()
            LIMIT 10
        `).all().map(m => {
            try {
                m.remembered_facts = JSON.parse(m.remembered_facts || '[]');
                m.inside_jokes = JSON.parse(m.inside_jokes || '[]');
                m.notable_moments = JSON.parse(m.notable_moments || '[]');
            } catch (e) {
                console.error(`Failed to parse devotee memory JSON:`, e);
                m.remembered_facts = [];
                m.inside_jokes = [];
                m.notable_moments = [];
            }
            return m;
        });
    },

    // Get users by relationship level
    getByRelationshipLevel(level) {
        return db.prepare('SELECT * FROM ika_memory WHERE relationship_level = ?').all(level);
    },

    // === DAILY ENGAGEMENT SYSTEM (P0-3) ===

    /**
     * Check and update daily check-in streak
     * @param {string} userId - User ID
     * @returns {{isFirst: boolean, streak: number, total: number, wasBroken: boolean}}
     */
    checkDailyStreak(userId) {
        const memory = this.get(userId);
        if (!memory) return { isFirst: false, streak: 0, total: 0, wasBroken: false };

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastCheckin = memory.last_daily_checkin;

        // Already checked in today
        if (lastCheckin === today) {
            return {
                isFirst: false,
                streak: memory.daily_streak || 0,
                total: memory.total_daily_checkins || 0,
                wasBroken: false,
            };
        }

        let newStreak = 1;
        let wasBroken = false;

        // Check if yesterday was last check-in (streak continues)
        if (lastCheckin) {
            const lastDate = new Date(lastCheckin + 'T00:00:00Z');
            const todayDate = new Date(today + 'T00:00:00Z');
            const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === 1) {
                // Consecutive day - increment streak
                newStreak = (memory.daily_streak || 0) + 1;
            } else if (daysDiff > 1) {
                // Streak broken
                newStreak = 1;
                wasBroken = (memory.daily_streak || 0) > 0;
            }
        }

        const newTotal = (memory.total_daily_checkins || 0) + 1;

        // Update database
        db.prepare(`
            UPDATE ika_memory
            SET daily_streak = ?,
                last_daily_checkin = ?,
                total_daily_checkins = ?
            WHERE user_id = ?
        `).run(newStreak, today, newTotal, userId);

        return {
            isFirst: true,
            streak: newStreak,
            total: newTotal,
            wasBroken,
        };
    },
};

// Ika message logging
const ikaMessageOps = {
    log(channelId, triggerUserId, triggerContent, response, responseType, mood) {
        db.prepare(`
            INSERT INTO ika_messages (channel_id, trigger_user_id, trigger_content, response, response_type, mood)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(channelId, triggerUserId, triggerContent, response, responseType, mood);
    },

    getRecent(limit = 50) {
        return db.prepare('SELECT * FROM ika_messages ORDER BY timestamp DESC LIMIT ?').all(limit);
    },

    // Get recent conversations with a specific user (for long-term memory)
    getUserConversations(userId, limit = 10) {
        return db.prepare(`
            SELECT trigger_content, response, timestamp
            FROM ika_messages
            WHERE trigger_user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(userId, limit);
    },

    getTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return db.prepare('SELECT COUNT(*) as count FROM ika_messages WHERE timestamp >= ?').get(today.toISOString()).count;
    },
};

// Ika moments (initiated conversations)
const ikaMomentOps = {
    log(momentType, content) {
        db.prepare('INSERT INTO ika_moments (moment_type, content) VALUES (?, ?)').run(momentType, content);
    },

    getRecent(limit = 20) {
        return db.prepare('SELECT * FROM ika_moments ORDER BY timestamp DESC LIMIT ?').all(limit);
    },

    getTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return db.prepare('SELECT COUNT(*) as count FROM ika_moments WHERE timestamp >= ?').get(today.toISOString()).count;
    },
};

// Ika state management
const ikaStateOps = {
    get(key) {
        const row = db.prepare('SELECT value FROM ika_state WHERE key = ?').get(key);
        return row ? row.value : null;
    },

    set(key, value) {
        db.prepare(`
            INSERT INTO ika_state (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
        `).run(key, value, value);
    },

    getCurrentMood() {
        return this.get('current_mood') || 'normal';
    },

    setCurrentMood(mood) {
        this.set('current_mood', mood);
    },

    getLastSpoke() {
        const val = this.get('last_spoke_at');
        return val ? parseInt(val) : 0;
    },

    setLastSpoke() {
        this.set('last_spoke_at', Date.now().toString());
    },
};

// Lore discovery operations
const loreOps = {
    // Log a lore fragment discovery
    discover(userId, category, fragmentIndex) {
        try {
            db.prepare(`
                INSERT INTO lore_discoveries (user_id, category, fragment_index)
                VALUES (?, ?, ?)
            `).run(userId, category, fragmentIndex);
            return true;
        } catch {
            return false; // Already discovered
        }
    },

    // Get discovered fragments for user
    getDiscovered(userId, category = null) {
        if (category) {
            return db.prepare(`
                SELECT * FROM lore_discoveries
                WHERE user_id = ? AND category = ?
                ORDER BY discovered_at
            `).all(userId, category);
        }
        return db.prepare(`
            SELECT * FROM lore_discoveries
            WHERE user_id = ?
            ORDER BY discovered_at
        `).all(userId);
    },

    // Check if fragment discovered
    isDiscovered(userId, category, fragmentIndex) {
        const row = db.prepare(`
            SELECT * FROM lore_discoveries
            WHERE user_id = ? AND category = ? AND fragment_index = ?
        `).get(userId, category, fragmentIndex);
        return !!row;
    },

    // Get discovery count by category for user
    getStatus(userId) {
        return db.prepare(`
            SELECT category, COUNT(*) as count
            FROM lore_discoveries
            WHERE user_id = ?
            GROUP BY category
        `).all(userId);
    },
};

// Secret phrase discovery operations
const secretOps = {
    // Log a secret discovery
    discover(userId, triggerPhrase) {
        try {
            db.prepare(`
                INSERT INTO secret_discoveries (user_id, trigger_phrase)
                VALUES (?, ?)
            `).run(userId, triggerPhrase);
            return true;
        } catch {
            return false; // Already discovered
        }
    },

    // Check if secret discovered
    isDiscovered(userId, triggerPhrase) {
        const row = db.prepare(`
            SELECT * FROM secret_discoveries
            WHERE user_id = ? AND trigger_phrase = ?
        `).get(userId, triggerPhrase);
        return !!row;
    },

    // Get all discovered secrets for user
    getDiscovered(userId) {
        return db.prepare(`
            SELECT * FROM secret_discoveries
            WHERE user_id = ?
            ORDER BY discovered_at
        `).all(userId);
    },
};

// Rare event operations
const rareEventOps = {
    // Log a rare event
    log(userId, eventType, messageContent) {
        db.prepare(`
            INSERT INTO rare_events (user_id, event_type, message_content)
            VALUES (?, ?, ?)
        `).run(userId, eventType, messageContent);
    },

    // Get last time event triggered for user
    getLastTrigger(userId, eventType) {
        const row = db.prepare(`
            SELECT triggered_at FROM rare_events
            WHERE user_id = ? AND event_type = ?
            ORDER BY triggered_at DESC
            LIMIT 1
        `).get(userId, eventType);
        return row ? new Date(row.triggered_at).getTime() : 0;
    },

    // Get all rare events for user
    getForUser(userId) {
        return db.prepare(`
            SELECT * FROM rare_events
            WHERE user_id = ?
            ORDER BY triggered_at DESC
        `).all(userId);
    },
};

// Time secret operations
const timeSecretOps = {
    // Log a time secret trigger
    log(userId, secretType) {
        try {
            db.prepare(`
                INSERT INTO time_secrets (user_id, secret_type)
                VALUES (?, ?)
            `).run(userId, secretType);
            return true;
        } catch {
            return false; // One-time secret already triggered
        }
    },

    // Check if time secret triggered (for one-time secrets)
    hasTriggered(userId, secretType) {
        const row = db.prepare(`
            SELECT * FROM time_secrets
            WHERE user_id = ? AND secret_type = ?
        `).get(userId, secretType);
        return !!row;
    },

    // Get last trigger time (for cooldown-based secrets)
    getLastTrigger(userId, secretType) {
        const row = db.prepare(`
            SELECT triggered_at FROM time_secrets
            WHERE user_id = ? AND secret_type = ?
            ORDER BY triggered_at DESC
            LIMIT 1
        `).get(userId, secretType);
        return row ? new Date(row.triggered_at).getTime() : 0;
    },
};

// Ritual operations
const ritualOps = {
    // Log ritual participation
    participate(userId, ritualType) {
        const today = new Date().toISOString().split('T')[0];
        try {
            db.prepare(`
                INSERT INTO ritual_participation (user_id, ritual_type, participated_at)
                VALUES (?, ?, ?)
            `).run(userId, ritualType, today);
            return true;
        } catch {
            return false; // Already participated today
        }
    },

    // Check if user participated today
    hasParticipatedToday(userId, ritualType) {
        const today = new Date().toISOString().split('T')[0];
        const row = db.prepare(`
            SELECT * FROM ritual_participation
            WHERE user_id = ? AND ritual_type = ? AND participated_at = ?
        `).get(userId, ritualType, today);
        return !!row;
    },

    // Log when a ritual was triggered (global)
    logRitual(ritualName) {
        db.prepare(`
            INSERT INTO ritual_log (ritual_name)
            VALUES (?)
        `).run(ritualName);
    },

    // Get last time a ritual was triggered
    getLastRitual(ritualName) {
        const row = db.prepare(`
            SELECT triggered_at FROM ritual_log
            WHERE ritual_name = ?
            ORDER BY triggered_at DESC
            LIMIT 1
        `).get(ritualName);
        return row ? new Date(row.triggered_at).getTime() : 0;
    },
};

// Extended ika memory operations for viral features
const ikaMemoryExtOps = {
    // Update intimacy stage
    setIntimacyStage(userId, stage) {
        db.prepare('UPDATE ika_memory SET intimacy_stage = ? WHERE user_id = ?').run(stage, userId);
    },

    // Set first interaction timestamp
    setFirstInteraction(userId) {
        const existing = db.prepare('SELECT first_interaction_at FROM ika_memory WHERE user_id = ?').get(userId);
        if (!existing?.first_interaction_at) {
            db.prepare('UPDATE ika_memory SET first_interaction_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(userId);
        }
    },

    // Increment jealousy mentions
    incrementJealousy(userId) {
        db.prepare('UPDATE ika_memory SET jealousy_mentions = jealousy_mentions + 1 WHERE user_id = ?').run(userId);
    },

    // Increment roast count
    incrementRoasts(userId) {
        db.prepare('UPDATE ika_memory SET roast_count = roast_count + 1 WHERE user_id = ?').run(userId);
    },

    // Increment protection moments
    incrementProtection(userId) {
        db.prepare('UPDATE ika_memory SET protection_moments = protection_moments + 1 WHERE user_id = ?').run(userId);
    },

    // Get and update growth milestones
    getGrowthMilestones(userId) {
        const row = db.prepare('SELECT growth_milestones_hit FROM ika_memory WHERE user_id = ?').get(userId);
        if (!row) return [];
        try {
            return JSON.parse(row.growth_milestones_hit || '[]');
        } catch (e) {
            console.error(`Failed to parse growth_milestones_hit for ${userId}:`, e);
            return [];
        }
    },

    addGrowthMilestone(userId, milestone) {
        const milestones = this.getGrowthMilestones(userId);
        if (!milestones.includes(milestone)) {
            milestones.push(milestone);
            db.prepare('UPDATE ika_memory SET growth_milestones_hit = ? WHERE user_id = ?')
                .run(JSON.stringify(milestones), userId);
            return true;
        }
        return false;
    },

    // Get most active users this week
    getMostActiveThisWeek(limit = 10) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        return db.prepare(`
            SELECT user_id, username, interaction_count
            FROM ika_memory
            WHERE last_interaction >= ?
            ORDER BY interaction_count DESC
            LIMIT ?
        `).all(weekAgo, limit);
    },
};

// === CRAZY FEATURES: New Operations ===

// Unprompted DM operations
const unpromptedDmOps = {
    // Log a sent DM
    log(userId, dmType, content) {
        db.prepare(`
            INSERT INTO unprompted_dms (user_id, dm_type, content)
            VALUES (?, ?, ?)
        `).run(userId, dmType, content);
    },

    // Get recent DMs to user
    getRecentToUser(userId, hours = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        return db.prepare(`
            SELECT * FROM unprompted_dms
            WHERE user_id = ? AND sent_at >= ?
            ORDER BY sent_at DESC
        `).all(userId, since);
    },

    // Get last DM of type to user
    getLastOfType(userId, dmType) {
        return db.prepare(`
            SELECT * FROM unprompted_dms
            WHERE user_id = ? AND dm_type = ?
            ORDER BY sent_at DESC
            LIMIT 1
        `).get(userId, dmType);
    },

    // Count DMs today
    countToday(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return db.prepare(`
            SELECT COUNT(*) as count FROM unprompted_dms
            WHERE user_id = ? AND sent_at >= ?
        `).get(userId, today.toISOString()).count;
    },
};

// Whisper Hunt ARG operations
const whisperOps = {
    // Drop a fragment in a channel
    dropFragment(fragmentId, channelId, messageId) {
        db.prepare(`
            INSERT INTO whisper_drops (fragment_id, channel_id, message_id)
            VALUES (?, ?, ?)
        `).run(fragmentId, channelId, messageId);
    },

    // Get active (unfound) drops
    getActiveDrops() {
        return db.prepare(`
            SELECT * FROM whisper_drops
            WHERE found = 0
            ORDER BY dropped_at DESC
        `).all();
    },

    // Mark fragment as found
    markFound(messageId, foundByUserId) {
        db.prepare(`
            UPDATE whisper_drops
            SET found = 1, found_by = ?, found_at = CURRENT_TIMESTAMP
            WHERE message_id = ?
        `).run(foundByUserId, messageId);
    },

    // Record user discovery
    recordDiscovery(userId, fragmentId) {
        try {
            db.prepare(`
                INSERT INTO whisper_found (user_id, fragment_id)
                VALUES (?, ?)
            `).run(userId, fragmentId);

            // Update user's fragment count
            db.prepare(`
                UPDATE ika_memory
                SET whisper_fragments_found = whisper_fragments_found + 1
                WHERE user_id = ?
            `).run(userId);

            return true;
        } catch {
            return false; // Already found
        }
    },

    // Get user's found fragments
    getUserFragments(userId) {
        return db.prepare(`
            SELECT fragment_id FROM whisper_found
            WHERE user_id = ?
            ORDER BY found_at
        `).all(userId).map(r => r.fragment_id);
    },

    // Check if user found fragment
    hasFound(userId, fragmentId) {
        const row = db.prepare(`
            SELECT * FROM whisper_found
            WHERE user_id = ? AND fragment_id = ?
        `).get(userId, fragmentId);
        return !!row;
    },

    // Get fragment discovery count
    getFragmentCount(fragmentId) {
        return db.prepare(`
            SELECT COUNT(*) as count FROM whisper_found
            WHERE fragment_id = ?
        `).get(fragmentId).count;
    },

    // Get leaderboard
    getLeaderboard(limit = 10) {
        return db.prepare(`
            SELECT user_id, COUNT(*) as fragments_found
            FROM whisper_found
            GROUP BY user_id
            ORDER BY fragments_found DESC
            LIMIT ?
        `).all(limit);
    },
};

// Anniversary operations
const anniversaryOps = {
    // Check if anniversary sent
    hasSent(userId, anniversaryType, daysCount) {
        const row = db.prepare(`
            SELECT * FROM anniversaries_sent
            WHERE user_id = ? AND anniversary_type = ? AND days_count = ?
        `).get(userId, anniversaryType, daysCount);
        return !!row;
    },

    // Log sent anniversary
    logSent(userId, anniversaryType, daysCount) {
        try {
            db.prepare(`
                INSERT INTO anniversaries_sent (user_id, anniversary_type, days_count)
                VALUES (?, ?, ?)
            `).run(userId, anniversaryType, daysCount);
            return true;
        } catch {
            return false;
        }
    },

    // Get all anniversaries for user
    getForUser(userId) {
        return db.prepare(`
            SELECT * FROM anniversaries_sent
            WHERE user_id = ?
            ORDER BY sent_at DESC
        `).all(userId);
    },
};

// Presence tracking operations
const presenceOps = {
    // Log presence event
    log(userId, eventType, oldValue, newValue) {
        db.prepare(`
            INSERT INTO presence_events (user_id, event_type, old_value, new_value)
            VALUES (?, ?, ?, ?)
        `).run(userId, eventType, oldValue, newValue);
    },

    // Get recent events for user
    getRecent(userId, hours = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        return db.prepare(`
            SELECT * FROM presence_events
            WHERE user_id = ? AND detected_at >= ?
            ORDER BY detected_at DESC
        `).all(userId, since);
    },

    // Mark event as responded
    markResponded(id) {
        db.prepare('UPDATE presence_events SET responded = 1 WHERE id = ?').run(id);
    },

    // Get unresponded events
    getUnresponded(userId) {
        return db.prepare(`
            SELECT * FROM presence_events
            WHERE user_id = ? AND responded = 0
            ORDER BY detected_at DESC
        `).all(userId);
    },

    // Update last presence notice time in ika_memory
    updateLastNotice(userId) {
        db.prepare('UPDATE ika_memory SET last_presence_notice = CURRENT_TIMESTAMP WHERE user_id = ?').run(userId);
    },

    // Check if can notice (cooldown)
    canNotice(userId, cooldownHours = 4) {
        const memory = db.prepare('SELECT last_presence_notice FROM ika_memory WHERE user_id = ?').get(userId);
        if (!memory?.last_presence_notice) return true;

        const lastNotice = new Date(memory.last_presence_notice).getTime();
        return Date.now() - lastNotice >= cooldownHours * 60 * 60 * 1000;
    },
};

// DM cooldown operations
const dmCooldownOps = {
    // Get or create cooldown record
    getOrCreate(userId) {
        const existing = db.prepare('SELECT * FROM dm_cooldowns WHERE user_id = ?').get(userId);
        if (existing) {
            // Check if needs reset
            const today = new Date().toISOString().split('T')[0];
            if (existing.last_reset !== today) {
                db.prepare(`
                    UPDATE dm_cooldowns
                    SET dms_today = 0, last_reset = ?
                    WHERE user_id = ?
                `).run(today, userId);
                return { ...existing, dms_today: 0, last_reset: today };
            }
            return existing;
        }

        const today = new Date().toISOString().split('T')[0];
        db.prepare(`
            INSERT INTO dm_cooldowns (user_id, last_reset)
            VALUES (?, ?)
        `).run(userId, today);
        return { user_id: userId, dms_today: 0, last_reset: today };
    },

    // Check if can send DM
    canSendDm(userId, maxPerDay = 2) {
        const record = this.getOrCreate(userId);
        return record.dms_today < maxPerDay;
    },

    // Record DM sent
    recordDmSent(userId) {
        const today = new Date().toISOString().split('T')[0];
        db.prepare(`
            UPDATE dm_cooldowns
            SET dms_today = dms_today + 1, last_unprompted_dm = CURRENT_TIMESTAMP, last_reset = ?
            WHERE user_id = ?
        `).run(today, userId);
    },

    // Get last DM time
    getLastDmTime(userId) {
        const record = db.prepare('SELECT last_unprompted_dm FROM dm_cooldowns WHERE user_id = ?').get(userId);
        return record?.last_unprompted_dm ? new Date(record.last_unprompted_dm).getTime() : 0;
    },
};

// Real name operations (added to ika memory)
const nameOps = {
    // Learn real name
    setRealName(userId, realName) {
        db.prepare(`
            UPDATE ika_memory
            SET real_name = ?, real_name_learned_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `).run(realName, userId);
    },

    // Get real name
    getRealName(userId) {
        const row = db.prepare('SELECT real_name FROM ika_memory WHERE user_id = ?').get(userId);
        return row?.real_name || null;
    },

    // Check if has real name
    hasRealName(userId) {
        return !!this.getRealName(userId);
    },

    // Get users with real names
    getUsersWithRealNames() {
        return db.prepare(`
            SELECT user_id, username, real_name
            FROM ika_memory
            WHERE real_name IS NOT NULL
        `).all();
    },

    // Increment handwritten notes count
    incrementHandwrittenNotes(userId) {
        db.prepare(`
            UPDATE ika_memory
            SET handwritten_notes_sent = handwritten_notes_sent + 1
            WHERE user_id = ?
        `).run(userId);
    },

    // Get handwritten notes count
    getHandwrittenNotesCount(userId) {
        const row = db.prepare('SELECT handwritten_notes_sent FROM ika_memory WHERE user_id = ?').get(userId);
        return row?.handwritten_notes_sent || 0;
    },
};

// === DM LIMITATIONS FIX: New operations ===

// DM status and logging operations
const dmOps = {
    // Check if we should attempt DM to this user
    checkDMStatus(userId) {
        const record = db.prepare(`
            SELECT dms_enabled, dm_failures, last_dm_attempt
            FROM ika_memory
            WHERE user_id = ?
        `).get(userId);

        if (!record) {
            return { shouldSkip: false }; // New user, try DM
        }

        // Skip if explicitly disabled
        if (record.dms_enabled === 0) {
            return { shouldSkip: true, reason: 'User has DMs disabled' };
        }

        // Skip if too many failures (max 3)
        if (record.dm_failures >= 3) {
            return { shouldSkip: true, reason: 'Too many DM failures' };
        }

        return { shouldSkip: false };
    },

    // Increment DM failure count
    incrementDMFailures(userId) {
        db.prepare(`
            UPDATE ika_memory
            SET dm_failures = dm_failures + 1, last_dm_attempt = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `).run(userId);
    },

    // Reset DM failures on successful DM
    resetDMFailures(userId) {
        db.prepare(`
            UPDATE ika_memory
            SET dm_failures = 0, dms_enabled = 1
            WHERE user_id = ?
        `).run(userId);
    },

    // Mark user as having DMs disabled
    markDMsDisabled(userId) {
        db.prepare(`
            UPDATE ika_memory
            SET dms_enabled = 0
            WHERE user_id = ?
        `).run(userId);
    },

    // Log DM attempt
    logDMAttempt(userId, dmType, contentPreview, success, errorCode = null, fallbackUsed = false) {
        const preview = typeof contentPreview === 'string'
            ? contentPreview.substring(0, 100)
            : (contentPreview?.content || '').substring(0, 100);

        db.prepare(`
            INSERT INTO dm_log (user_id, dm_type, content_preview, success, fallback_used, error_code)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, dmType, preview, success ? 1 : 0, fallbackUsed ? 1 : 0, errorCode);
    },

    // Get DM log for user
    getDMLog(userId, limit = 20) {
        return db.prepare(`
            SELECT * FROM dm_log
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(userId, limit);
    },

    // Get DM failure stats
    getDMStats() {
        return {
            totalAttempts: db.prepare('SELECT COUNT(*) as count FROM dm_log').get().count,
            failures: db.prepare('SELECT COUNT(*) as count FROM dm_log WHERE success = 0').get().count,
            fallbacks: db.prepare('SELECT COUNT(*) as count FROM dm_log WHERE fallback_used = 1').get().count,
            usersWithDMsDisabled: db.prepare('SELECT COUNT(*) as count FROM ika_memory WHERE dms_enabled = 0').get().count,
        };
    },
};

// DM preferences operations (opt-in for unprompted DMs)
const dmPrefsOps = {
    // Check if user has opted into unprompted DMs
    canSendUnprompted(userId) {
        const pref = db.prepare(`
            SELECT unprompted_enabled FROM dm_preferences WHERE user_id = ?
        `).get(userId);

        return pref?.unprompted_enabled === 1;
    },

    // Opt in to unprompted DMs
    optIn(userId) {
        db.prepare(`
            INSERT INTO dm_preferences (user_id, unprompted_enabled, opted_in_at)
            VALUES (?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                unprompted_enabled = 1,
                opted_in_at = CURRENT_TIMESTAMP
        `).run(userId);
    },

    // Opt out of unprompted DMs
    optOut(userId) {
        db.prepare(`
            INSERT INTO dm_preferences (user_id, unprompted_enabled, opted_out_at)
            VALUES (?, 0, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                unprompted_enabled = 0,
                opted_out_at = CURRENT_TIMESTAMP
        `).run(userId);
    },

    // Get preference status
    getStatus(userId) {
        return db.prepare(`
            SELECT * FROM dm_preferences WHERE user_id = ?
        `).get(userId);
    },

    // Get all opted-in users
    getOptedInUsers() {
        return db.prepare(`
            SELECT p.user_id, m.username, m.intimacy_stage, m.last_interaction
            FROM dm_preferences p
            JOIN ika_memory m ON p.user_id = m.user_id
            WHERE p.unprompted_enabled = 1
            AND m.dms_enabled = 1
            AND m.dm_failures < 3
        `).all();
    },
};

// Fragment log operations
const fragmentLogOps = {
    log(userId, gateNumber, deliveredVia) {
        db.prepare(`
            INSERT INTO fragment_log (user_id, gate_number, delivered_via)
            VALUES (?, ?, ?)
        `).run(userId, gateNumber, deliveredVia);
    },

    getForUser(userId) {
        return db.prepare(`
            SELECT * FROM fragment_log
            WHERE user_id = ?
            ORDER BY timestamp DESC
        `).all(userId);
    },
};

// Gate progress operations (wrapper for gate-related queries)
const gateOps = {
    // Get current gate (highest completed + 1)
    getCurrentGate(discordId) {
        return userOps.getCurrentGate(discordId);
    },

    // Complete a gate
    complete(discordId, gateNumber, extraData = {}) {
        return userOps.completeGate(discordId, gateNumber, extraData);
    },

    // Check if user has completed a gate
    hasCompleted(discordId, gateNumber) {
        return userOps.hasCompletedGate(discordId, gateNumber);
    },

    // Get user's gate progress details
    getProgress(discordId) {
        const user = userOps.get(discordId);
        if (!user) return { currentGate: 0, completedGates: [], totalCompleted: 0 };

        const completedGates = [];
        for (let i = 1; i <= 7; i++) {
            if (user[`gate_${i}_at`]) {
                completedGates.push({
                    gate: i,
                    completedAt: user[`gate_${i}_at`],
                });
            }
        }

        return {
            currentGate: userOps.getCurrentGate(discordId),
            completedGates,
            totalCompleted: completedGates.length,
            isAscended: !!user.ascended_at,
            ascendedAt: user.ascended_at,
            startedAt: user.gate_1_at,
            totalTimeSeconds: user.total_time_seconds,
        };
    },

    // Check if user has access to a gate
    hasAccess(discordId, gateNumber) {
        if (gateNumber === 1) return true;
        return userOps.hasCompletedGate(discordId, gateNumber - 1);
    },

    // Get gate completion stats
    getStats() {
        return userOps.getStats();
    },

    // Get first completions
    getFirsts() {
        return userOps.getFirsts();
    },
};

// === REFERRAL SYSTEM (P0-6) ===

const referralOps = {
    /**
     * Generate unique 6-character invite code
     * @param {string} userId - User ID
     * @returns {string} - Unique invite code (uppercase alphanumeric)
     */
    generateInviteCode(userId) {
        const crypto = require('crypto');
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            // Generate 6 random bytes, convert to base36 and take 6 chars
            const randomBytes = crypto.randomBytes(4);
            const code = randomBytes.toString('base36').toUpperCase().substring(0, 6);

            // Pad with random chars if needed
            const paddedCode = code.padEnd(6, 'ABCDEF'[Math.floor(Math.random() * 6)]);

            // Check uniqueness
            const existing = db.prepare('SELECT invite_code FROM users WHERE invite_code = ?').get(paddedCode);
            if (!existing) {
                return paddedCode;
            }

            attempts++;
        }

        // Fallback: use timestamp-based code
        const timestamp = Date.now().toString(36).toUpperCase();
        return timestamp.substring(timestamp.length - 6);
    },

    /**
     * Get existing invite code or create new one
     * @param {string} userId - User ID
     * @returns {string} - User's invite code
     */
    getOrCreateCode(userId) {
        const user = db.prepare('SELECT invite_code FROM users WHERE discord_id = ?').get(userId);

        if (user?.invite_code) {
            return user.invite_code;
        }

        // Generate and save new code
        const code = this.generateInviteCode(userId);
        db.prepare('UPDATE users SET invite_code = ? WHERE discord_id = ?').run(code, userId);
        return code;
    },

    /**
     * Get referral statistics for user
     * @param {string} userId - User ID
     * @returns {object} - Stats including total invited, completed count, recent invites
     */
    getStats(userId) {
        // Get total invited count
        const totalInvited = db.prepare(`
            SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?
        `).get(userId)?.count || 0;

        // Get completed count (Gate 1 completions)
        const completedCount = db.prepare(`
            SELECT COUNT(*) as count FROM referrals
            WHERE referrer_id = ? AND referral_completed = 1
        `).get(userId)?.count || 0;

        // Get recent invites (last 5)
        const recentInvites = db.prepare(`
            SELECT referred_username, created_at, referral_completed
            FROM referrals
            WHERE referrer_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `).all(userId);

        return {
            totalInvited,
            completedCount,
            recentInvites,
            conversionRate: totalInvited > 0 ? (completedCount / totalInvited * 100).toFixed(1) : 0,
        };
    },

    /**
     * Record a new referral
     * @param {string} referrerId - Referrer's Discord ID
     * @param {string} referredId - Referred user's Discord ID
     * @param {string} referredUsername - Referred user's username
     * @returns {boolean} - Success status
     */
    recordReferral(referrerId, referredId, referredUsername) {
        try {
            db.prepare(`
                INSERT INTO referrals (referrer_id, referred_id, referred_username)
                VALUES (?, ?, ?)
            `).run(referrerId, referredId, referredUsername);

            return true;
        } catch (error) {
            console.error('Error recording referral:', error);
            return false;
        }
    },

    /**
     * Mark referral as completed when referred user completes Gate 1
     * @param {string} referredId - Referred user's Discord ID
     * @returns {string|null} - Referrer ID if successful, null otherwise
     */
    markCompleted(referredId) {
        try {
            // Get referral info first
            const referral = db.prepare(`
                SELECT referrer_id FROM referrals WHERE referred_id = ?
            `).get(referredId);

            if (!referral) return null;

            // Mark as completed
            db.prepare(`
                UPDATE referrals SET referral_completed = 1 WHERE referred_id = ?
            `).run(referredId);

            // Increment referrer's invite count
            db.prepare(`
                UPDATE users SET invite_count = invite_count + 1 WHERE discord_id = ?
            `).run(referral.referrer_id);

            return referral.referrer_id;
        } catch (error) {
            console.error('Error marking referral completed:', error);
            return null;
        }
    },

    /**
     * Get top referrers leaderboard
     * @param {number} limit - Number of top referrers to return
     * @returns {array} - Array of top referrers with counts
     */
    getTopReferrers(limit = 10) {
        return db.prepare(`
            SELECT u.discord_id, u.username, u.invite_count,
                   COUNT(r.id) as total_referrals,
                   SUM(CASE WHEN r.referral_completed = 1 THEN 1 ELSE 0 END) as completed_referrals
            FROM users u
            LEFT JOIN referrals r ON u.discord_id = r.referrer_id
            WHERE u.invite_count > 0
            GROUP BY u.discord_id
            ORDER BY u.invite_count DESC
            LIMIT ?
        `).all(limit);
    },

    /**
     * Get referrer info for a referred user
     * @param {string} referredId - Referred user's Discord ID
     * @returns {object|null} - Referrer info or null
     */
    getReferrer(referredId) {
        return db.prepare(`
            SELECT r.referrer_id, u.username as referrer_username
            FROM referrals r
            JOIN users u ON r.referrer_id = u.discord_id
            WHERE r.referred_id = ?
        `).get(referredId);
    },

    /**
     * Get user position on leaderboard
     * @param {string} userId - User ID
     * @returns {number|null} - Position (1-indexed) or null if not in top positions
     */
    getLeaderboardPosition(userId) {
        const leaderboard = this.getTopReferrers(100);
        const position = leaderboard.findIndex(user => user.discord_id === userId);
        return position >= 0 ? position + 1 : null;
    },
};

module.exports = {
    db,
    userOps,
    gateOps,
    gate5Ops,
    fragmentOps,
    offeringOps,
    vowOps,
    ikaMemoryOps,
    ikaMessageOps,
    ikaMomentOps,
    ikaStateOps,
    loreOps,
    secretOps,
    rareEventOps,
    timeSecretOps,
    ritualOps,
    ikaMemoryExtOps,
    // CRAZY FEATURES: New operations
    unpromptedDmOps,
    whisperOps,
    anniversaryOps,
    presenceOps,
    dmCooldownOps,
    nameOps,
    // DM LIMITATIONS FIX: New operations
    dmOps,
    dmPrefsOps,
    fragmentLogOps,
    // REFERRAL SYSTEM (P0-6)
    referralOps,
};
