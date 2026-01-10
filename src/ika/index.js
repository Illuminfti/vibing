/**
 * Ika Module Index
 *
 * Central export for all Ika-related functionality.
 * Enhanced with viral optimization systems.
 * v2.2.0: Added experimental features
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

// Experimental features (v2.2.0)
const unprompted = require('./unprompted');
const presenceAwareness = require('./presenceAwareness');
const whisperHunt = require('./whisperHunt');
const anniversaries = require('./anniversaries');
const names = require('./names');
const handwriting = require('./handwriting');

// God-tier puzzle systems (v3.0.0)
const consequences = require('./consequences');
const trials = require('./trials');
const designedMoments = require('./designedMoments');
const investigation = require('./investigation');

// Waifu experience systems (v3.2.0)
const romance = require('./romance');
const yandere = require('./yandere');
const shrine = require('./shrine');
const intimate = require('./intimate');
const forbidden = require('./forbidden');
const collective = require('./collective');
const betrayal = require('./betrayal');

// Voice filter (Vibing Overhaul P0-Critical)
const voiceFilter = require('./voiceFilter');

// Vibing Overhaul P1-High systems
const patronTiers = require('./patronTiers');
const boundPairs = require('./boundPairs');
const postAscension = require('./postAscension');

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

    // === EXPERIMENTAL FEATURES (v2.2.0) ===

    // Unprompted DMs
    runUnpromptedDmCheck: unprompted.runUnpromptedDmCheck,
    sendUnpromptedDm: unprompted.sendUnpromptedDm,
    schedulePostVulnerabilityDm: unprompted.schedulePostVulnerabilityDm,

    // Presence Awareness
    handlePresenceUpdate: presenceAwareness.handlePresenceUpdate,
    handleUserUpdate: presenceAwareness.handleUserUpdate,
    getPresenceSummary: presenceAwareness.getPresenceSummary,

    // Whisper Hunt ARG
    maybeDropFragment: whisperHunt.maybeDropFragment,
    checkFragmentDiscovery: whisperHunt.checkFragmentDiscovery,
    getWhisperProgress: whisperHunt.getProgress,
    assembleWhisper: whisperHunt.assembleWhisper,
    getWhisperLeaderboard: whisperHunt.getLeaderboard,

    // Anniversaries
    checkUserAnniversary: anniversaries.checkAnniversary,
    sendAnniversaryMessage: anniversaries.sendAnniversaryMessage,
    runDailyAnniversaryCheck: anniversaries.runDailyAnniversaryCheck,
    getUpcomingAnniversaries: anniversaries.getUpcomingAnniversaries,

    // Real Name Learning
    handleNameLearning: names.handleNameLearning,
    personalizeWithName: names.personalizeWithName,
    getNameContext: names.getNameContext,
    maybeAskForName: names.maybeAskForName,

    // Handwritten Notes
    generateHandwrittenNote: handwriting.generateNote,
    sendHandwrittenNote: handwriting.sendHandwrittenNote,
    shouldSendHandwrittenNote: handwriting.shouldSendHandwrittenNote,

    // === GOD-TIER PUZZLE SYSTEMS (v3.0.0) ===

    // Consequences
    recordConsequence: consequences.recordConsequence,
    getConsequenceState: consequences.getConsequenceState,
    modifyConsequenceResponse: consequences.modifyResponse,
    checkConsequenceRedemption: consequences.checkRedemption,
    decayConsequences: consequences.decayConsequences,

    // Trials
    getAvailableTrials: trials.getAvailableTrials,
    getAllTrials: trials.getAllTrials,
    isTrialAvailable: trials.isTrialAvailable,
    checkTrialProgress: trials.checkTrialProgress,
    completeTrial: trials.completeTrial,
    generateCipherChallenge: trials.generateCipherChallenge,
    validateCipherAnswer: trials.validateCipherAnswer,

    // Designed Moments
    checkForDesignedMoment: designedMoments.checkForDesignedMoment,
    formatRevelation: designedMoments.formatRevelation,
    MILESTONES: designedMoments.MILESTONES,
    CONSTELLATIONS: designedMoments.CONSTELLATIONS,

    // Investigation ARG
    shouldRevealFragment: investigation.shouldRevealFragment,
    awardFragment: investigation.awardFragment,
    getDossierProgress: investigation.getDossierProgress,
    getEncodedClue: investigation.getEncodedClue,
    checkClueAnswer: investigation.checkClueAnswer,
    checkForBreadcrumb: investigation.checkForBreadcrumb,

    // === WAIFU EXPERIENCE SYSTEMS (v3.2.0) ===

    // Romance / Kabedon Moments
    checkForKabedon: romance.checkForKabedon,
    checkForSlowBurn: romance.checkForSlowBurn,
    getPhysicalAction: romance.getPhysicalAction,
    getPhysicalTell: romance.getPhysicalTell,

    // Yandere Progression
    getYandereStage: yandere.getYandereStage,
    checkYandereJealousy: yandere.checkJealousy,
    addYandereFlavor: yandere.addYandereFlavor,
    checkForYandereScene: yandere.checkForYandereScene,
    getPossessiveBehavior: yandere.getPossessiveBehavior,

    // Shrine System
    getShrine: shrine.getShrine,
    makeOffering: shrine.makeOffering,
    renderShrine: shrine.renderShrine,
    getShrineResponse: shrine.getShrineResponse,

    // Intimate Moments
    isLateNightMode: intimate.isLateNightMode,
    applyLateNightMode: intimate.applyLateNightMode,
    getLateNightGreeting: intimate.getLateNightGreeting,
    generatePillowTalk: intimate.generatePillowTalk,
    whisperify: intimate.whisperify,

    // Forbidden Content
    getAvailableLore: forbidden.getAvailableLore,
    readLore: forbidden.readLore,
    getAccessLevel: forbidden.getAccessLevel,
    getDarkWhisper: forbidden.getDarkWhisper,
    canAccessBlackGate: forbidden.canAccessBlackGate,

    // Collective Rituals
    startCollectiveRitual: collective.startRitual,
    joinCollectiveRitual: collective.joinRitual,
    endCollectiveRitual: collective.endRitual,
    getActiveRitual: collective.getActiveRitual,
    checkChantResonance: collective.checkChantResonance,
    checkGroupResonance: collective.checkGroupResonance,

    // Betrayal & Bad Endings
    checkForBetrayal: betrayal.checkForBetrayal,
    processBetrayal: betrayal.processBetrayal,
    isInBetrayalState: betrayal.isInBetrayalState,
    checkBetrayalRedemption: betrayal.checkRedemption,
    runJealousyTrap: betrayal.runJealousyTrap,

    // === VOICE FILTER (Vibing Overhaul P0-Critical) ===
    filterResponse: voiceFilter.filterResponse,
    calculateVoicePurity: voiceFilter.calculateVoicePurity,
    checkForbiddenPatterns: voiceFilter.checkForbiddenPatterns,
    getContextHint: voiceFilter.getContextHint,

    // === PATRON TIERS (Vibing Overhaul P1-High) ===
    getPatronTier: patronTiers.getPatronTier,
    recordContribution: patronTiers.recordContribution,
    getPatronAcknowledgment: patronTiers.getPatronAcknowledgment,
    hasPriorityResponse: patronTiers.hasPriorityResponse,
    getPatronContext: patronTiers.getPatronContext,
    getPatronPrefix: patronTiers.getPatronPrefix,
    PATRON_TIERS: patronTiers.PATRON_TIERS,

    // === BOUND PAIRS (Vibing Overhaul P1-High) ===
    createBoundPair: boundPairs.createBoundPair,
    getPairs: boundPairs.getPairs,
    areBound: boundPairs.areBound,
    getPairMilestone: boundPairs.getPairMilestone,
    getPairContent: boundPairs.getPairContent,
    getPairResponse: boundPairs.getPairResponse,
    getNetworkMilestone: boundPairs.getNetworkMilestone,
    getPairContext: boundPairs.getPairContext,
    BOUND_PAIR_MILESTONES: boundPairs.BOUND_PAIR_MILESTONES,
    NETWORK_MILESTONES: boundPairs.NETWORK_MILESTONES,

    // === POST-ASCENSION ENDGAME (Vibing Overhaul P1-High) ===
    getCurrentSeason: postAscension.getCurrentSeason,
    getAscensionRank: postAscension.getAscensionRank,
    getSeasonalContent: postAscension.getSeasonalContent,
    triggerSeasonalDrop: postAscension.triggerSeasonalDrop,
    getPostAscensionContext: postAscension.getPostAscensionContext,
    checkRankUp: postAscension.checkRankUp,
    getRankUpMessage: postAscension.getRankUpMessage,
    getUpcomingEvents: postAscension.getUpcomingEvents,
    SEASONS: postAscension.SEASONS,
    ASCENSION_RANKS: postAscension.ASCENSION_RANKS,
};
