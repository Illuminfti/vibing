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
        idle_warning_sent INTEGER DEFAULT 0
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
`);

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

    // Update user field
    update(discordId, field, value) {
        db.prepare(`UPDATE users SET ${field} = ? WHERE discord_id = ?`).run(value, discordId);
    },

    // Complete a gate
    completeGate(discordId, gateNumber, extraData = {}) {
        const timestamp = new Date().toISOString();
        const updates = [`gate_${gateNumber}_at = ?`];
        const values = [timestamp];

        for (const [key, value] of Object.entries(extraData)) {
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

    // Get user's progress
    getProgress(discordId) {
        const sent = db.prepare('SELECT COUNT(*) as count FROM gate5_schedule WHERE discord_id = ? AND sent = 1').get(discordId);
        return sent.count;
    },

    // Check if all messages sent
    allMessagesSent(discordId) {
        return this.getProgress(discordId) >= 6;
    },

    // Clear schedule for user
    clear(discordId) {
        db.prepare('DELETE FROM gate5_schedule WHERE discord_id = ?').run(discordId);
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

module.exports = {
    db,
    userOps,
    gate5Ops,
    offeringOps,
    vowOps,
};
