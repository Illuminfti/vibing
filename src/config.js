require('dotenv').config();

module.exports = {
    // Discord credentials
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // Channel IDs
    channels: {
        waitingRoom: process.env.WAITING_ROOM_ID,
        chamber1: process.env.CHAMBER_1_ID,
        chamber2: process.env.CHAMBER_2_ID,
        chamber3: process.env.CHAMBER_3_ID,
        chamber4: process.env.CHAMBER_4_ID,
        chamber5: process.env.CHAMBER_5_ID,
        chamber6: process.env.CHAMBER_6_ID,
        innerSanctum: process.env.INNER_SANCTUM_ID,
        offerings: process.env.OFFERINGS_CHANNEL_ID,
        vows: process.env.VOWS_CHANNEL_ID,
    },

    // Role IDs
    roles: {
        lostSoul: process.env.LOST_SOUL_ROLE_ID,
        gate1: process.env.GATE_1_ROLE_ID,
        gate2: process.env.GATE_2_ROLE_ID,
        gate3: process.env.GATE_3_ROLE_ID,
        gate4: process.env.GATE_4_ROLE_ID,
        gate5: process.env.GATE_5_ROLE_ID,
        gate6: process.env.GATE_6_ROLE_ID,
        gate7: process.env.GATE_7_ROLE_ID,
        ascended: process.env.ASCENDED_ROLE_ID,
        mod: process.env.MOD_ROLE_ID,
    },

    // Settings
    testMode: process.env.TEST_MODE === 'true',

    // Anthropic API
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,

    // Ika presence settings
    ika: {
        enabled: process.env.IKA_AI_ENABLED !== 'false',
        passiveChance: parseFloat(process.env.IKA_PASSIVE_CHANCE) || 0.35,
        momentInterval: parseInt(process.env.IKA_MOMENT_INTERVAL) || 3600000,
        presenceCheckInterval: 180000,  // Check chat every 3 minutes
        cooldownMs: 60000,              // Min time between responses
        maxContextMessages: 20,         // Messages to include as context
        vulnerabilityWindows: 2,        // Number per day

        // === EXPERIMENTAL FEATURES (v2.2.0) ===

        // Unprompted DMs
        unpromptedDmsEnabled: process.env.IKA_UNPROMPTED_DMS_ENABLED !== 'false',
        maxDmsPerDay: parseInt(process.env.IKA_MAX_DMS_PER_DAY) || 2,

        // Presence Awareness
        presenceAwarenessEnabled: process.env.IKA_PRESENCE_AWARENESS_ENABLED !== 'false',
        presenceCooldownHours: parseInt(process.env.IKA_PRESENCE_COOLDOWN_HOURS) || 4,

        // Whisper Hunt ARG
        whisperHuntEnabled: process.env.IKA_WHISPER_HUNT_ENABLED !== 'false',
        whisperDropChance: parseFloat(process.env.IKA_WHISPER_DROP_CHANCE) || 0.015,

        // Anniversaries
        anniversariesEnabled: process.env.IKA_ANNIVERSARIES_ENABLED !== 'false',

        // Fading/Save Mechanic
        fadingEnabled: process.env.IKA_FADING_ENABLED !== 'false',

        // Real Name Learning
        namesEnabled: process.env.IKA_NAMES_ENABLED !== 'false',

        // Handwritten Notes
        handwrittenNotesEnabled: process.env.IKA_HANDWRITTEN_NOTES_ENABLED !== 'false',
    },

    // Timing constants (in milliseconds)
    timing: {
        responseDelay: 1500,           // delay before bot responses
        gate5Interval: 3 * 60 * 1000,  // 3 minutes between Gate 5 messages
        gate5TestInterval: 10 * 1000,  // 10 seconds in test mode
        idleWarning: 30 * 60 * 1000,   // 30 minutes idle warning
        votingTimeout: 24 * 60 * 60 * 1000, // 24 hours for voting
        fragmentDelay: { min: 5 * 60 * 1000, max: 10 * 60 * 1000 }, // 5-10 min after gate
        typingDelay: { min: 2000, max: 5000 },
        responseTypingDelay: { min: 10000, max: 30000 },
    },

    // Colors (in hex)
    colors: {
        primary: 0xff69b4,    // hot pink
        success: 0x9932cc,    // dark orchid
        error: 0x8b0000,      // dark red
        ethereal: 0xe6e6fa,   // lavender
    },

    // === OPTIMIZATION SETTINGS (v3.3.0) ===
    optimization: {
        // Global API rate limit (calls per minute)
        maxApiCallsPerMinute: parseInt(process.env.MAX_API_CALLS_PER_MIN) || 60,

        // Enable response caching
        enableCache: process.env.ENABLE_RESPONSE_CACHE !== 'false',

        // Cache TTL in milliseconds (default: 30 min)
        cacheTtlMs: parseInt(process.env.CACHE_TTL_MS) || 1800000,

        // Enable spam detection
        enableSpamDetection: process.env.ENABLE_SPAM_DETECTION !== 'false',

        // Use canned responses for simple messages
        useCannedResponses: process.env.USE_CANNED_RESPONSES !== 'false',

        // AI response chance per tier (lower = less API calls)
        aiChanceByTier: {
            new: parseFloat(process.env.AI_CHANCE_NEW) || 0.3,
            normal: parseFloat(process.env.AI_CHANCE_NORMAL) || 0.5,
            devoted: parseFloat(process.env.AI_CHANCE_DEVOTED) || 0.8,
            ascended: parseFloat(process.env.AI_CHANCE_ASCENDED) || 0.95,
        },

        // Data archival settings
        archiveInactiveDays: parseInt(process.env.ARCHIVE_INACTIVE_DAYS) || 90,

        // Run cleanup every N hours
        cleanupIntervalHours: parseInt(process.env.CLEANUP_INTERVAL_HOURS) || 24,

        // Maximum prompt tokens to send to API
        maxPromptTokens: parseInt(process.env.MAX_PROMPT_TOKENS) || 2000,

        // Maximum response tokens to request from API
        maxResponseTokens: parseInt(process.env.MAX_RESPONSE_TOKENS) || 300,

        // === COST MODE (v3.3.1) ===
        // Options: 'normal', 'low', 'ultraLow', 'minimal', 'free'
        costMode: process.env.COST_MODE || 'ultraLow',
    },

    // Puzzle answers (loaded from .env to keep them secret)
    // These should NOT be committed to the repository
    puzzles: {
        gate2Answers: process.env.GATE_2_ANSWERS
            ? process.env.GATE_2_ANSWERS.split(',').map(a => a.trim().toLowerCase())
            : [],
        gate4Answers: process.env.GATE_4_ANSWERS
            ? process.env.GATE_4_ANSWERS.split(',').map(a => a.trim().toLowerCase())
            : [],
    },

    // Helper to get gate role by number (1-7)
    getGateRole(gateNumber) {
        return this.roles[`gate${gateNumber}`];
    },

    // Helper to get all gate role IDs
    getAllGateRoles() {
        return [1, 2, 3, 4, 5, 6, 7].map(n => this.roles[`gate${n}`]).filter(Boolean);
    },

    // Helper to get chamber channel by number (1-6)
    getChamber(chamberNumber) {
        return this.channels[`chamber${chamberNumber}`];
    },
};
