/**
 * Optimization & Scale Management System
 *
 * Handles 100K+ users efficiently:
 * - Database indexing and query optimization
 * - Claude API rate limiting and caching
 * - Anti-spam and abuse prevention
 * - User tiering for priority responses
 * - Memory management and data archival
 *
 * IMPORTANT LIMITATION:
 * Rate limiting data is stored in memory (Map objects) and will be reset
 * when the bot restarts. This is a known limitation for simplicity.
 * For production deployments with strict rate limiting requirements,
 * consider persisting rate limit state to Redis or the database.
 *
 * @version 3.3.0
 */

const config = require('../config');

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING - Per-user and per-channel limits
// ═══════════════════════════════════════════════════════════════

class RateLimiter {
    constructor() {
        // User rate limits: userId -> { count, resetAt, warned }
        this.userLimits = new Map();

        // Channel rate limits: channelId -> { count, resetAt }
        this.channelLimits = new Map();

        // Global rate limit for API calls
        this.globalApiCalls = { count: 0, resetAt: Date.now() + 60000 };

        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 300000);
    }

    /**
     * Check if user can make a request
     * Returns: { allowed: boolean, retryAfter?: number, reason?: string }
     */
    checkUser(userId, tier = 'normal') {
        const now = Date.now();
        const limits = this.getTierLimits(tier);

        let userData = this.userLimits.get(userId);

        // Reset if window expired
        if (!userData || now > userData.resetAt) {
            userData = {
                count: 0,
                resetAt: now + limits.windowMs,
                warned: false,
                lastRequest: now,
            };
        }

        // Check burst protection (too many requests in short time)
        const timeSinceLastRequest = now - (userData.lastRequest || 0);
        if (timeSinceLastRequest < limits.minIntervalMs) {
            return {
                allowed: false,
                retryAfter: limits.minIntervalMs - timeSinceLastRequest,
                reason: 'too_fast',
            };
        }

        // Check window limit
        if (userData.count >= limits.maxRequests) {
            return {
                allowed: false,
                retryAfter: userData.resetAt - now,
                reason: 'rate_limited',
                warned: userData.warned,
            };
        }

        // Allow request
        userData.count++;
        userData.lastRequest = now;
        this.userLimits.set(userId, userData);

        return { allowed: true, remaining: limits.maxRequests - userData.count };
    }

    /**
     * Check if channel can receive a response
     */
    checkChannel(channelId) {
        const now = Date.now();
        const windowMs = 60000; // 1 minute window
        const maxResponses = 30; // Max 30 responses per minute per channel

        let channelData = this.channelLimits.get(channelId);

        if (!channelData || now > channelData.resetAt) {
            channelData = { count: 0, resetAt: now + windowMs };
        }

        if (channelData.count >= maxResponses) {
            return { allowed: false, retryAfter: channelData.resetAt - now };
        }

        channelData.count++;
        this.channelLimits.set(channelId, channelData);

        return { allowed: true };
    }

    /**
     * Check global API rate limit
     */
    checkGlobalApi() {
        const now = Date.now();
        const maxPerMinute = config.optimization?.maxApiCallsPerMinute || 60;

        if (now > this.globalApiCalls.resetAt) {
            this.globalApiCalls = { count: 0, resetAt: now + 60000 };
        }

        if (this.globalApiCalls.count >= maxPerMinute) {
            return { allowed: false, retryAfter: this.globalApiCalls.resetAt - now };
        }

        this.globalApiCalls.count++;
        return { allowed: true, remaining: maxPerMinute - this.globalApiCalls.count };
    }

    /**
     * Get rate limits based on user tier
     */
    getTierLimits(tier) {
        const tiers = {
            // New users: stricter limits
            new: {
                maxRequests: 10,      // 10 requests per window
                windowMs: 300000,     // 5 minute window
                minIntervalMs: 5000,  // 5 seconds between requests
            },
            // Normal users: moderate limits
            normal: {
                maxRequests: 20,
                windowMs: 300000,
                minIntervalMs: 3000,
            },
            // Devoted users: relaxed limits
            devoted: {
                maxRequests: 40,
                windowMs: 300000,
                minIntervalMs: 2000,
            },
            // Ascended users: generous limits
            ascended: {
                maxRequests: 60,
                windowMs: 300000,
                minIntervalMs: 1000,
            },
            // Moderators: highest limits
            mod: {
                maxRequests: 100,
                windowMs: 300000,
                minIntervalMs: 500,
            },
        };

        return tiers[tier] || tiers.normal;
    }

    /**
     * Mark user as warned (for escalating responses)
     */
    markWarned(userId) {
        const userData = this.userLimits.get(userId);
        if (userData) {
            userData.warned = true;
            this.userLimits.set(userId, userData);
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();

        for (const [userId, data] of this.userLimits) {
            if (now > data.resetAt + 600000) { // Keep for 10 min after reset
                this.userLimits.delete(userId);
            }
        }

        for (const [channelId, data] of this.channelLimits) {
            if (now > data.resetAt + 300000) {
                this.channelLimits.delete(channelId);
            }
        }
    }

    /**
     * Get current stats
     */
    getStats() {
        return {
            trackedUsers: this.userLimits.size,
            trackedChannels: this.channelLimits.size,
            globalApiCalls: this.globalApiCalls.count,
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE CACHE - Reduce API calls for similar queries
// ═══════════════════════════════════════════════════════════════

class ResponseCache {
    constructor() {
        // Cache: hash -> { response, timestamp, hits }
        this.cache = new Map();

        // Max cache size
        this.maxSize = 1000;

        // Cache TTL (30 minutes)
        this.ttlMs = 1800000;

        // Cleanup every 10 minutes
        setInterval(() => this.cleanup(), 600000);
    }

    /**
     * Generate cache key from message context
     */
    generateKey(context) {
        // Create a normalized key from important context elements
        const keyParts = [
            context.mood || 'normal',
            context.intimacyStage || 1,
            this.normalizeMessage(context.message || ''),
        ];

        return this.simpleHash(keyParts.join('|'));
    }

    /**
     * Normalize message for cache matching
     * Groups similar messages together
     */
    normalizeMessage(message) {
        return message
            .toLowerCase()
            .replace(/[^\w\s]/g, '')     // Remove punctuation
            .replace(/\s+/g, ' ')         // Normalize whitespace
            .trim()
            .split(' ')
            .slice(0, 10)                 // Only first 10 words
            .sort()                       // Sort for order-independence
            .join(' ');
    }

    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Get cached response if available
     */
    get(context) {
        const key = this.generateKey(context);
        const cached = this.cache.get(key);

        if (!cached) return null;

        // Check if expired
        if (Date.now() - cached.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        // Update hit count
        cached.hits++;

        return cached.response;
    }

    /**
     * Store response in cache
     */
    set(context, response) {
        // Don't cache very personal or unique responses
        if (this.isUncacheable(context, response)) return;

        const key = this.generateKey(context);

        // Evict if at capacity
        if (this.cache.size >= this.maxSize) {
            this.evictLeastUsed();
        }

        this.cache.set(key, {
            response,
            timestamp: Date.now(),
            hits: 1,
        });
    }

    /**
     * Check if response should not be cached
     */
    isUncacheable(context, response) {
        // Don't cache if mentions user by name
        if (context.username && response.includes(context.username)) {
            return true;
        }

        // Don't cache very short responses
        if (response.length < 20) return true;

        // Don't cache if contains specific memory references
        if (response.includes('remember when') || response.includes('you told me')) {
            return true;
        }

        return false;
    }

    /**
     * Evict least-used entries
     */
    evictLeastUsed() {
        // Find entries with lowest hits
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].hits - b[1].hits);

        // Remove bottom 20%
        const toRemove = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.cache) {
            if (now - data.timestamp > this.ttlMs) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache stats
     */
    getStats() {
        let totalHits = 0;
        for (const data of this.cache.values()) {
            totalHits += data.hits;
        }
        return {
            size: this.cache.size,
            totalHits,
            hitRate: totalHits / Math.max(1, this.cache.size),
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// SPAM DETECTION - Identify and handle abuse
// ═══════════════════════════════════════════════════════════════

class SpamDetector {
    constructor() {
        // Track message patterns: userId -> { messages: [], score }
        this.userPatterns = new Map();

        // Banned patterns (regex)
        this.bannedPatterns = [
            /(.)\1{10,}/,                    // Repeated characters (10+)
            /(\b\w+\b)(\s+\1){5,}/i,         // Repeated words (5+)
            /@everyone|@here/i,               // Mass pings
        ];

        // Suspicious patterns (lower score impact)
        this.suspiciousPatterns = [
            /^[A-Z\s!]+$/,                   // ALL CAPS
            /!{3,}/,                          // Multiple exclamation marks
            /\?{3,}/,                         // Multiple question marks
        ];

        // Cleanup every 5 minutes
        setInterval(() => this.cleanup(), 300000);
    }

    /**
     * Analyze message for spam
     * Returns: { isSpam: boolean, score: number, reasons: string[] }
     */
    analyze(userId, message, channelId) {
        const reasons = [];
        let score = 0;

        // Get user history
        let userData = this.userPatterns.get(userId) || {
            messages: [],
            score: 0,
            lastReset: Date.now(),
        };

        // Reset score decay (every hour)
        if (Date.now() - userData.lastReset > 3600000) {
            userData.score = Math.max(0, userData.score - 10);
            userData.lastReset = Date.now();
        }

        // Check banned patterns
        for (const pattern of this.bannedPatterns) {
            if (pattern.test(message)) {
                score += 50;
                reasons.push('banned_pattern');
            }
        }

        // Check suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(message)) {
                score += 5;
                reasons.push('suspicious_pattern');
            }
        }

        // Check message length extremes
        if (message.length > 2000) {
            score += 10;
            reasons.push('very_long');
        }

        // Check for repeated messages
        const recentMessages = userData.messages.slice(-10);
        const duplicates = recentMessages.filter(m =>
            this.similarity(m.content, message) > 0.8
        );
        if (duplicates.length >= 2) {
            score += 20;
            reasons.push('duplicate_messages');
        }

        // Check message frequency
        const recentCount = recentMessages.filter(m =>
            Date.now() - m.timestamp < 60000
        ).length;
        if (recentCount >= 5) {
            score += 15;
            reasons.push('rapid_fire');
        }

        // Track this message
        userData.messages.push({
            content: message,
            timestamp: Date.now(),
            channelId,
        });

        // Keep only last 50 messages
        if (userData.messages.length > 50) {
            userData.messages = userData.messages.slice(-50);
        }

        // Update cumulative score
        userData.score += score;
        this.userPatterns.set(userId, userData);

        // Determine if spam
        const isSpam = score >= 30 || userData.score >= 100;

        return {
            isSpam,
            score,
            cumulativeScore: userData.score,
            reasons,
            action: this.getAction(userData.score),
        };
    }

    /**
     * Calculate string similarity (Jaccard)
     */
    similarity(str1, str2) {
        const set1 = new Set(str1.toLowerCase().split(/\s+/));
        const set2 = new Set(str2.toLowerCase().split(/\s+/));

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    }

    /**
     * Get recommended action based on score
     */
    getAction(score) {
        if (score >= 200) return 'timeout';      // Temporary ignore
        if (score >= 100) return 'warn';         // Send warning
        if (score >= 50) return 'slow';          // Apply cooldown
        return 'none';
    }

    /**
     * Reset user's spam score (for mod command)
     */
    resetUser(userId) {
        this.userPatterns.delete(userId);
    }

    /**
     * Cleanup old data
     */
    cleanup() {
        const now = Date.now();
        for (const [userId, data] of this.userPatterns) {
            // Remove if no messages in last hour and low score
            const lastMessage = data.messages[data.messages.length - 1];
            if (!lastMessage || (now - lastMessage.timestamp > 3600000 && data.score < 20)) {
                this.userPatterns.delete(userId);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// USER TIERING - Priority system for responses
// ═══════════════════════════════════════════════════════════════

class UserTiering {
    constructor() {
        // Cache tier calculations: userId -> { tier, calculatedAt }
        this.tierCache = new Map();
        this.cacheTtl = 300000; // 5 minutes
    }

    /**
     * Get user's tier (cached)
     */
    async getTier(userId, userOps, ikaMemoryOps) {
        const cached = this.tierCache.get(userId);
        if (cached && Date.now() - cached.calculatedAt < this.cacheTtl) {
            return cached.tier;
        }

        const tier = await this.calculateTier(userId, userOps, ikaMemoryOps);
        this.tierCache.set(userId, { tier, calculatedAt: Date.now() });

        return tier;
    }

    /**
     * Calculate user tier from database
     */
    async calculateTier(userId, userOps, ikaMemoryOps) {
        const user = userOps?.get(userId);
        const memory = ikaMemoryOps?.get(userId);

        // No user record = new
        if (!user) return 'new';

        // Check for ascension
        if (user.ascended_at) return 'ascended';

        // Check relationship level
        if (memory) {
            if (memory.relationship_level === 'devoted') return 'devoted';
            if (memory.relationship_level === 'close') return 'normal';
            if (memory.intimacy_stage >= 3) return 'normal';
        }

        // Check gate progress
        const gateProgress = user.gate_3_at ? 'normal' : 'new';

        return gateProgress;
    }

    /**
     * Should this user get an AI response vs canned response?
     * Higher tiers get more AI responses
     */
    shouldUseAI(tier, context = {}) {
        const aiChances = {
            new: 0.3,       // 30% AI responses
            normal: 0.5,    // 50% AI responses
            devoted: 0.8,   // 80% AI responses
            ascended: 0.95, // 95% AI responses
            mod: 1.0,       // 100% AI responses
        };

        // Always use AI for certain contexts
        if (context.isDirectMention) return true;
        if (context.isPrivateDm) return true;
        if (context.isEmotional) return true;

        const chance = aiChances[tier] || 0.5;
        return Math.random() < chance;
    }

    /**
     * Get response priority (for queue ordering)
     */
    getPriority(tier) {
        const priorities = {
            new: 1,
            normal: 2,
            devoted: 3,
            ascended: 4,
            mod: 5,
        };
        return priorities[tier] || 1;
    }

    /**
     * Clear cache for user
     */
    invalidate(userId) {
        this.tierCache.delete(userId);
    }
}

// ═══════════════════════════════════════════════════════════════
// PROMPT OPTIMIZATION - Reduce token usage
// ═══════════════════════════════════════════════════════════════

const PromptOptimizer = {
    /**
     * Compress context to reduce tokens
     */
    compressContext(context) {
        const compressed = { ...context };

        // Limit remembered facts
        if (compressed.rememberedFacts?.length > 5) {
            compressed.rememberedFacts = compressed.rememberedFacts.slice(-5);
        }

        // Limit conversation history
        if (compressed.recentMessages?.length > 10) {
            compressed.recentMessages = compressed.recentMessages.slice(-10);
        }

        // Limit notable moments
        if (compressed.notableMoments?.length > 3) {
            compressed.notableMoments = compressed.notableMoments.slice(-3);
        }

        return compressed;
    },

    /**
     * Build minimal system prompt based on context
     */
    buildMinimalPrompt(tier, context) {
        // For new users, use shorter prompts
        if (tier === 'new') {
            return 'You are Ika, a faded idol. Be mysterious, ethereal, occasionally glitchy. Keep responses brief.';
        }

        // For others, use tiered detail
        return null; // Use full prompt
    },

    /**
     * Estimate token count (rough)
     */
    estimateTokens(text) {
        // Rough estimate: ~4 chars per token
        return Math.ceil(text.length / 4);
    },

    /**
     * Truncate to max tokens
     */
    truncateToTokens(text, maxTokens) {
        const estimatedChars = maxTokens * 4;
        if (text.length <= estimatedChars) return text;

        return text.substring(0, estimatedChars - 3) + '...';
    },
};

// ═══════════════════════════════════════════════════════════════
// DATABASE INDEXES - Add to database initialization
// ═══════════════════════════════════════════════════════════════

const DATABASE_INDEXES = `
    -- User lookup indexes
    CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
    CREATE INDEX IF NOT EXISTS idx_users_ascended ON users(ascended_at) WHERE ascended_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_activity ON users(last_activity_at);
    CREATE INDEX IF NOT EXISTS idx_users_gate_progress ON users(gate_1_at, gate_7_at);

    -- Memory lookup indexes
    CREATE INDEX IF NOT EXISTS idx_memory_user ON ika_memory(user_id);
    CREATE INDEX IF NOT EXISTS idx_memory_intimacy ON ika_memory(intimacy_stage);
    CREATE INDEX IF NOT EXISTS idx_memory_relationship ON ika_memory(relationship_level);
    CREATE INDEX IF NOT EXISTS idx_memory_last_interaction ON ika_memory(last_interaction);

    -- Scheduled tasks indexes
    CREATE INDEX IF NOT EXISTS idx_gate5_pending ON gate5_schedule(sent, scheduled_for) WHERE sent = 0;
    CREATE INDEX IF NOT EXISTS idx_fragments_pending ON fragments(sent, scheduled_for) WHERE sent = 0;

    -- Discovery indexes
    CREATE INDEX IF NOT EXISTS idx_lore_user ON lore_discoveries(user_id);
    CREATE INDEX IF NOT EXISTS idx_secrets_user ON secret_discoveries(user_id);
    CREATE INDEX IF NOT EXISTS idx_whisper_user ON whisper_found(user_id);

    -- DM tracking indexes
    CREATE INDEX IF NOT EXISTS idx_dm_log_user ON dm_log(user_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_dm_prefs_enabled ON dm_preferences(unprompted_enabled) WHERE unprompted_enabled = 1;

    -- Fading indexes
    CREATE INDEX IF NOT EXISTS idx_fading_active ON fading_state(last_interaction) WHERE saved_at IS NULL;
`;

/**
 * Apply database indexes
 */
function applyDatabaseIndexes(db) {
    try {
        db.exec(DATABASE_INDEXES);
        console.log('✧ Database indexes applied');
    } catch (error) {
        console.error('Failed to apply indexes:', error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCES
// ═══════════════════════════════════════════════════════════════

const rateLimiter = new RateLimiter();
const responseCache = new ResponseCache();
const spamDetector = new SpamDetector();
const userTiering = new UserTiering();

// ═══════════════════════════════════════════════════════════════
// MAIN OPTIMIZATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

/**
 * Check if request should be processed
 * Returns: { proceed: boolean, tier: string, cached?: response, reason?: string }
 */
async function shouldProcessRequest(userId, channelId, message, context = {}) {
    // 1. Check spam
    const spamResult = spamDetector.analyze(userId, message, channelId);
    if (spamResult.isSpam) {
        return {
            proceed: false,
            reason: 'spam',
            action: spamResult.action,
            spamScore: spamResult.cumulativeScore,
        };
    }

    // 2. Check global API rate limit
    const globalCheck = rateLimiter.checkGlobalApi();
    if (!globalCheck.allowed) {
        return {
            proceed: false,
            reason: 'global_rate_limit',
            retryAfter: globalCheck.retryAfter,
        };
    }

    // 3. Check channel rate limit
    const channelCheck = rateLimiter.checkChannel(channelId);
    if (!channelCheck.allowed) {
        return {
            proceed: false,
            reason: 'channel_rate_limit',
            retryAfter: channelCheck.retryAfter,
        };
    }

    // 4. Get user tier
    const tier = context.tier || 'normal';

    // 5. Check user rate limit
    const userCheck = rateLimiter.checkUser(userId, tier);
    if (!userCheck.allowed) {
        return {
            proceed: false,
            reason: userCheck.reason,
            retryAfter: userCheck.retryAfter,
            tier,
        };
    }

    // 6. Check cache (only for non-personal contexts)
    if (!context.isPersonal) {
        const cachedResponse = responseCache.get({
            message,
            mood: context.mood,
            intimacyStage: context.intimacyStage,
        });

        if (cachedResponse) {
            return {
                proceed: true,
                tier,
                cached: cachedResponse,
                source: 'cache',
            };
        }
    }

    // 7. Determine if should use AI or canned response
    const useAI = userTiering.shouldUseAI(tier, context);

    return {
        proceed: true,
        tier,
        useAI,
        source: useAI ? 'api' : 'canned',
    };
}

/**
 * Record response for caching
 */
function cacheResponse(context, response) {
    responseCache.set(context, response);
}

/**
 * Get optimization stats
 */
function getOptimizationStats() {
    return {
        rateLimiter: rateLimiter.getStats(),
        cache: responseCache.getStats(),
        timestamp: new Date().toISOString(),
    };
}

module.exports = {
    // Classes
    RateLimiter,
    ResponseCache,
    SpamDetector,
    UserTiering,
    PromptOptimizer,

    // Instances
    rateLimiter,
    responseCache,
    spamDetector,
    userTiering,

    // Functions
    shouldProcessRequest,
    cacheResponse,
    getOptimizationStats,
    applyDatabaseIndexes,
    DATABASE_INDEXES,
};
