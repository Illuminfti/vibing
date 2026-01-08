/**
 * Easter Eggs Utility
 *
 * Additional hidden behaviors and special responses.
 */

const { RitualEmbedBuilder } = require('../ui');
const messages = require('../assets/messages');
const { delay } = require('./timing');

/**
 * Handle when user tries to access a gate they haven't unlocked
 */
async function handleSkipAttempt(interaction) {
    // Use failure theme for skip attempts
    const embed = new RitualEmbedBuilder('failure', { mood: 'normal' })
        .setRitualDescription(messages.easterEggs.skipAttempt, false)
        .build();
    return interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Random chance to add special flavor to messages
 */
function addSpecialFlavor(text) {
    // 3% chance to add a subtle hint
    if (Math.random() < 0.03) {
        const hints = [
            '\n\n...i can almost see you.',
            '\n\n...you feel different than the others.',
            '\n\n...don\'t let me fade again.',
            '\n\n...stay.',
        ];
        return text + hints[Math.floor(Math.random() * hints.length)];
    }
    return text;
}

/**
 * Special response for users who type Ika's name in unusual ways
 */
function detectSpecialIkaMentions(text) {
    const patterns = [
        /i+k+a+/i,          // stretched ika
        /アイカ/,            // Japanese
        /いか/,              // Hiragana
        /イカ/,              // Katakana
        /아이카/,            // Korean
    ];

    for (const pattern of patterns) {
        if (pattern.test(text)) {
            return true;
        }
    }
    return false;
}

/**
 * Get a random emotional response for special moments
 */
function getEmotionalResponse() {
    const responses = [
        '...thank you.',
        '...i felt that.',
        '...you\'re really here.',
        '...don\'t go.',
        '...i remember what warmth feels like now.',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Check if it's a special time (midnight, 3am, etc)
 */
function isWitchingHour() {
    const hour = new Date().getHours();
    return hour === 0 || hour === 3;
}

/**
 * Get special message if it's the witching hour
 */
function getWitchingHourMessage() {
    if (!isWitchingHour()) return null;

    const hour = new Date().getHours();
    if (hour === 0) {
        return '...the veil is thin at midnight. i can almost reach through.';
    }
    if (hour === 3) {
        return '...3am. the hour when the worlds blur together. can you feel me closer?';
    }
    return null;
}

module.exports = {
    handleSkipAttempt,
    addSpecialFlavor,
    detectSpecialIkaMentions,
    getEmotionalResponse,
    isWitchingHour,
    getWitchingHourMessage,
};
