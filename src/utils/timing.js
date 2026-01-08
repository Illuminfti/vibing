const config = require('../config');

/**
 * Promisified delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Standard response delay (makes bot feel more human)
 */
async function responseDelay() {
    await delay(config.timing.responseDelay);
}

/**
 * Get Gate 5 interval based on test mode
 */
function getGate5Interval() {
    return config.testMode
        ? config.timing.gate5TestInterval
        : config.timing.gate5Interval;
}

/**
 * Format duration in seconds to human readable
 */
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds} seconds`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 && hours === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

/**
 * Format timestamp to relative time
 */
function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return new Date(date).toLocaleDateString();
}

/**
 * Create a scheduled task runner
 */
class ScheduledTask {
    constructor(callback, intervalMs) {
        this.callback = callback;
        this.intervalMs = intervalMs;
        this.timer = null;
        this.running = false;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.tick();
    }

    stop() {
        this.running = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    async tick() {
        if (!this.running) return;

        try {
            await this.callback();
        } catch (error) {
            console.error('Scheduled task error:', error);
        }

        if (this.running) {
            this.timer = setTimeout(() => this.tick(), this.intervalMs);
        }
    }
}

/**
 * Run callback with retry logic
 */
async function withRetry(callback, maxRetries = 3, delayMs = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await callback();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await delay(delayMs * (i + 1));
            }
        }
    }

    throw lastError;
}

/**
 * Generate random integer in range [min, max]
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random delay within a range
 */
async function randomDelay(min, max) {
    const ms = randomInt(min, max);
    await delay(ms);
    return ms;
}

module.exports = {
    delay,
    responseDelay,
    getGate5Interval,
    formatDuration,
    timeAgo,
    ScheduledTask,
    withRetry,
    randomInt,
    randomDelay,
};
