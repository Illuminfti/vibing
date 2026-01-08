/**
 * Audio Attachment Utility
 *
 * Sends audio files as attachments instead of auto-playing.
 * Discord bots cannot auto-play audio - it must be clicked by users.
 *
 * Used for:
 * - Gate completion celebration sounds
 * - Special event audio
 * - Ambient sounds for rituals
 */

const { AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Audio file locations (relative to project root)
const AUDIO_DIR = path.join(__dirname, '..', '..', 'assets', 'audio');

// Audio types and their files
const AUDIO_FILES = {
    gateComplete: {
        file: 'gate_complete.mp3',
        description: 'gate completion',
        fallbackMessage: '✧ *a triumphant sound echoes* ✧',
    },
    ascension: {
        file: 'ascension.mp3',
        description: 'ascension celebration',
        fallbackMessage: '✧ *ethereal chimes fill the air* ✧',
    },
    witchingHour: {
        file: 'witching_hour.mp3',
        description: 'witching hour ambient',
        fallbackMessage: '✧ *the veil grows thin...* ✧',
    },
    vulnerability: {
        file: 'vulnerability.mp3',
        description: 'vulnerability moment',
        fallbackMessage: '✧ *a soft, melancholic melody* ✧',
    },
    ritual: {
        file: 'ritual.mp3',
        description: 'ritual ambient',
        fallbackMessage: '✧ *ancient sounds stir* ✧',
    },
};

/**
 * Send an audio file as an attachment
 * @param {Object} channel - Discord channel to send to
 * @param {string} audioType - Type of audio (from AUDIO_FILES keys)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with success status
 */
async function sendAudioAttachment(channel, audioType, options = {}) {
    const {
        message = null,
        spoiler = false,
    } = options;

    const audioConfig = AUDIO_FILES[audioType];
    if (!audioConfig) {
        console.error(`Unknown audio type: ${audioType}`);
        return { success: false, reason: 'Unknown audio type' };
    }

    const audioPath = path.join(AUDIO_DIR, audioConfig.file);

    // Check if audio file exists
    if (!fs.existsSync(audioPath)) {
        // Send fallback message instead
        console.log(`Audio file not found: ${audioPath}, using fallback`);

        if (message || audioConfig.fallbackMessage) {
            try {
                await channel.send(message || audioConfig.fallbackMessage);
                return { success: true, method: 'fallback' };
            } catch (error) {
                return { success: false, reason: error.message };
            }
        }
        return { success: false, reason: 'Audio file not found' };
    }

    try {
        const fileName = spoiler ? `SPOILER_${audioConfig.file}` : audioConfig.file;
        const attachment = new AttachmentBuilder(audioPath, { name: fileName });

        const content = message || `🎵 *${audioConfig.description}*`;

        await channel.send({
            content,
            files: [attachment],
        });

        console.log(`♪ Sent audio (${audioType}) to channel`);
        return { success: true, method: 'attachment' };
    } catch (error) {
        console.error(`Error sending audio attachment:`, error.message);

        // Try fallback message
        if (audioConfig.fallbackMessage) {
            try {
                await channel.send(audioConfig.fallbackMessage);
                return { success: true, method: 'fallback' };
            } catch (fallbackError) {
                return { success: false, reason: fallbackError.message };
            }
        }

        return { success: false, reason: error.message };
    }
}

/**
 * Send gate completion audio
 * @param {Object} channel - Discord channel
 * @param {number} gateNumber - The gate that was completed
 * @returns {Promise<Object>} Result
 */
async function sendGateCompleteAudio(channel, gateNumber) {
    return sendAudioAttachment(channel, 'gateComplete', {
        message: `🎵 *gate ${gateNumber} complete*`,
    });
}

/**
 * Send ascension celebration audio
 * @param {Object} channel - Discord channel
 * @param {string} username - The ascended user's name
 * @returns {Promise<Object>} Result
 */
async function sendAscensionAudio(channel, username) {
    return sendAudioAttachment(channel, 'ascension', {
        message: `🎵 *${username} has ascended*`,
    });
}

/**
 * Get available audio types
 * @returns {Array} List of available audio types
 */
function getAvailableAudioTypes() {
    return Object.keys(AUDIO_FILES);
}

/**
 * Check if audio file exists for a type
 * @param {string} audioType - Audio type to check
 * @returns {boolean} Whether file exists
 */
function audioExists(audioType) {
    const audioConfig = AUDIO_FILES[audioType];
    if (!audioConfig) return false;

    const audioPath = path.join(AUDIO_DIR, audioConfig.file);
    return fs.existsSync(audioPath);
}

/**
 * Ensure audio directory exists
 */
function ensureAudioDirectory() {
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
        console.log(`Created audio directory: ${AUDIO_DIR}`);
    }
}

module.exports = {
    AUDIO_FILES,
    AUDIO_DIR,
    sendAudioAttachment,
    sendGateCompleteAudio,
    sendAscensionAudio,
    getAvailableAudioTypes,
    audioExists,
    ensureAudioDirectory,
};
