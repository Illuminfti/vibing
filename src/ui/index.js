/**
 * Seven Gates UI System
 *
 * Centralized export for all UI components, themes, and builders.
 * Import from here for cleaner code.
 *
 * @version 1.0.0
 */

// Themes
const gateThemes = require('./themes/gateThemes');
const moodOverlays = require('./themes/moodOverlays');

// Builders
const { RitualEmbedBuilder, createGateSuccessEmbed, createGateFailureEmbed, createWelcomeEmbed, createIkaEmbed, EASTER_EGGS } = require('./builders/ritualEmbed');
const { RitualSequence, TIMING, playGateSuccess, playGateFailure, playAscension } = require('./builders/ritualSequence');

// Components
const errorMessages = require('./components/errorMessages');

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE RE-EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    // Theme systems
    ...gateThemes,
    ...moodOverlays,

    // Embed builders
    RitualEmbedBuilder,
    createGateSuccessEmbed,
    createGateFailureEmbed,
    createWelcomeEmbed,
    createIkaEmbed,
    EASTER_EGGS,

    // Sequence builders
    RitualSequence,
    TIMING,
    playGateSuccess,
    playGateFailure,
    playAscension,

    // Error handling
    ...errorMessages,

    // Quick access to commonly used functions
    themes: gateThemes,
    moods: moodOverlays,
    errors: errorMessages,
};
