/**
 * Ika Module Index
 *
 * Central export for all Ika-related functionality.
 */

const presence = require('./presence');
const personality = require('./personality');
const moods = require('./moods');
const memory = require('./memory');
const generator = require('./generator');
const moments = require('./moments');
const vulnerability = require('./vulnerability');
const relationships = require('./relationships');

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
};
