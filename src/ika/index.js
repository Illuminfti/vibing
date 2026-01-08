/**
 * Ika Module Index
 *
 * Central export for all Ika-related functionality.
 * Enhanced with viral optimization systems.
 */

const presence = require('./presence');
const personality = require('./personality');
const moods = require('./moods');
const memory = require('./memory');
const generator = require('./generator');
const moments = require('./moments');
const vulnerability = require('./vulnerability');
const relationships = require('./relationships');

// Viral optimization modules
const secrets = require('./secrets');
const rareEvents = require('./rareEvents');
const timeSecrets = require('./timeSecrets');
const lore = require('./lore');
const jealousy = require('./jealousy');
const protection = require('./protection');
const roasts = require('./roasts');
const growth = require('./growth');
const rituals = require('./rituals');
const intimacy = require('./intimacy');

module.exports = {
    // Presence system
    startPresenceLoop: presence.startPresenceLoop,
    welcomeNewAscended: presence.welcomeNewAscended,
    handleReturnAfterAbsence: presence.handleReturnAfterAbsence,
    handleMilestone: presence.handleMilestone,
    getClient: presence.getClient,

    // Response generation
    generateResponse: generator.generateResponse,
    generateWelcomeMessage: generator.generateWelcomeMessage,
    canRespond: generator.canRespond,

    // Moods
    getCurrentMood: moods.getCurrentMood,
    getMoodModifiers: moods.getMoodModifiers,
    forceMood: moods.forceMood,
    isWitchingHour: moods.isWitchingHour,

    // Memory
    getMemoryContext: memory.getMemoryContext,
    initializeMemory: memory.initializeMemory,
    recordInteraction: memory.recordInteraction,
    rememberFact: memory.rememberFact,
    addInsideJoke: memory.addInsideJoke,
    setNickname: memory.setNickname,
    getRelationshipTier: memory.getRelationshipTier,
    getMilestoneMessage: memory.getMilestoneMessage,

    // Relationships
    canReferenceJourney: relationships.canReferenceJourney,
    canUseNickname: relationships.canUseNickname,
    getDevotedUsers: relationships.getDevotedUsers,
    notifyMilestoneIfNeeded: relationships.notifyMilestoneIfNeeded,

    // Moments
    initiateMoment: moments.initiateMoment,
    getDeepQuestion: moments.getDeepQuestion,

    // Vulnerability
    scheduleVulnerabilityWindows: vulnerability.scheduleVulnerabilityWindows,
    forceVulnerabilityMoment: vulnerability.forceVulnerabilityMoment,

    // Personality
    checkCannedTrigger: personality.checkCannedTrigger,
    evaluateInterest: personality.evaluateInterest,

    // === VIRAL OPTIMIZATION SYSTEMS ===

    // Secrets
    checkSecretTriggers: secrets.checkSecretTriggers,
    getDiscoveryStats: secrets.getDiscoveryStats,

    // Rare Events
    checkRareEvents: rareEvents.checkRareEvents,
    getRareEventHistory: rareEvents.getRareEventHistory,

    // Time Secrets
    checkTimeSecrets: timeSecrets.checkTimeSecrets,
    checkFirstOfDay: timeSecrets.checkFirstOfDay,
    checkAnniversary: timeSecrets.checkAnniversary,
    isLateNight: timeSecrets.isLateNight,
    getTimeContext: timeSecrets.getTimeContext,

    // Lore
    getLoreFragment: lore.getLoreFragment,
    getLoreStatus: lore.getLoreStatus,
    getTotalLoreProgress: lore.getTotalLoreProgress,

    // Jealousy
    checkJealousy: jealousy.checkJealousy,
    checkConversationHijack: jealousy.checkConversationHijack,
    getReturnResponse: jealousy.getReturnResponse,

    // Protection
    checkProtectionTrigger: protection.checkProtectionTrigger,
    handleProtectionMoment: protection.handleProtectionMoment,
    checkSelfDoubt: protection.checkSelfDoubt,
    checkSeriousConcern: protection.checkSeriousConcern,

    // Roasts
    checkRoastTrigger: roasts.checkRoastTrigger,
    handleRoast: roasts.handleRoast,
    getComeback: roasts.getComeback,

    // Growth
    checkGrowthMilestone: growth.checkGrowthMilestone,
    getProgressSummary: growth.getProgressSummary,
    recognizeAchievement: growth.recognizeAchievement,

    // Rituals
    checkDailyRituals: rituals.checkDailyRituals,
    getDiscussionPrompt: rituals.getDiscussionPrompt,
    trackParticipation: rituals.trackParticipation,
    getRitualResponse: rituals.getRitualResponse,

    // Intimacy
    calculateIntimacyStage: intimacy.calculateIntimacyStage,
    getIntimacyInstructions: intimacy.getIntimacyInstructions,
    getStageInfo: intimacy.getStageInfo,
    checkStageIncrease: intimacy.checkStageIncrease,
    getStageAnnouncement: intimacy.getStageAnnouncement,
    getStageProgress: intimacy.getStageProgress,
};
