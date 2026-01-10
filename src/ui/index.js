/**
 * Seven Gates UI System
 *
 * Centralized export for all UI components, themes, and builders.
 * Import from here for cleaner code.
 *
 * @version 2.0.0
 */

// Themes
const gateThemes = require('./themes/gateThemes');
const moodOverlays = require('./themes/moodOverlays');

// Builders
const { RitualEmbedBuilder, createGateSuccessEmbed, createGateFailureEmbed, createWelcomeEmbed, createIkaEmbed, EASTER_EGGS } = require('./builders/ritualEmbed');
const { RitualSequence, TIMING, playGateSuccess, playGateFailure, playAscension } = require('./builders/ritualSequence');
const { RitualButtonBuilder, createConfirmCancelRow, createNavigationRow, createShareRow, createGateActionRow, BUTTON_PRESETS, GATE_EMOJIS } = require('./builders/ritualButton');
const { RitualModalBuilder, createConfessionModal, createVowModal, createOfferingModal, createAbsenceModal, createFeedbackModal, createSimpleModal, MODAL_PRESETS, GATE_MODAL_TITLES } = require('./builders/ritualModal');
const { PaginatedEmbed, createLorePagination, createListPagination, createGalleryPagination } = require('./builders/paginatedEmbed');

// Flex Cards (Vibing Overhaul P0-Critical: Screenshot infrastructure)
const {
    FLEX_TYPES,
    CARD_FRAMES,
    createDevotionAwakenedCard,
    createGateCompletionCard,
    createRareMomentCard,
    createDevotionReceipt,
    createWhisperFragmentCard,
    createIntimacyMilestoneCard,
    createBetrayalCard,
    createShareText,
} = require('./builders/flexCards');

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

    // Button builders
    RitualButtonBuilder,
    createConfirmCancelRow,
    createNavigationRow,
    createShareRow,
    createGateActionRow,
    BUTTON_PRESETS,
    GATE_EMOJIS,

    // Modal builders
    RitualModalBuilder,
    createConfessionModal,
    createVowModal,
    createOfferingModal,
    createAbsenceModal,
    createFeedbackModal,
    createSimpleModal,
    MODAL_PRESETS,
    GATE_MODAL_TITLES,

    // Paginated embeds
    PaginatedEmbed,
    createLorePagination,
    createListPagination,
    createGalleryPagination,

    // Flex Cards (Vibing Overhaul)
    FLEX_TYPES,
    CARD_FRAMES,
    createDevotionAwakenedCard,
    createGateCompletionCard,
    createRareMomentCard,
    createDevotionReceipt,
    createWhisperFragmentCard,
    createIntimacyMilestoneCard,
    createBetrayalCard,
    createShareText,

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
