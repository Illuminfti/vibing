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
        growth_milestones_hit TEXT DEFAULT '[]'
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
            existing.remembered_facts = JSON.parse(existing.remembered_facts || '[]');
            existing.inside_jokes = JSON.parse(existing.inside_jokes || '[]');
            existing.notable_moments = JSON.parse(existing.notable_moments || '[]');
            return existing;
        }

        db.prepare('INSERT INTO ika_memory (user_id, username) VALUES (?, ?)').run(userId, username);
        return this.get(userId);
    },

    // Get memory
    get(userId) {
        const memory = db.prepare('SELECT * FROM ika_memory WHERE user_id = ?').get(userId);
        if (!memory) return null;

        memory.remembered_facts = JSON.parse(memory.remembered_facts || '[]');
        memory.inside_jokes = JSON.parse(memory.inside_jokes || '[]');
        memory.notable_moments = JSON.parse(memory.notable_moments || '[]');
        return memory;
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
            m.remembered_facts = JSON.parse(m.remembered_facts || '[]');
            m.inside_jokes = JSON.parse(m.inside_jokes || '[]');
            m.notable_moments = JSON.parse(m.notable_moments || '[]');
            return m;
        });
    },

    // Get users by relationship level
    getByRelationshipLevel(level) {
        return db.prepare('SELECT * FROM ika_memory WHERE relationship_level = ?').all(level);
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
        return row ? JSON.parse(row.growth_milestones_hit || '[]') : [];
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

module.exports = {
    db,
    userOps,
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
};
