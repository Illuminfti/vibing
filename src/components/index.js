/**
 * Components Module Index
 *
 * Central export for all interactive component functionality.
 */

const handlers = require('./handlers');
const builders = require('./builders');
const flows = require('./flows');

module.exports = {
    // Handlers
    handleButton: handlers.handleButton,
    handleModal: handlers.handleModal,
    handleSelect: handlers.handleSelect,
    initializeAllHandlers: handlers.initializeAllHandlers,

    // Registration (for custom handlers)
    registerButtonHandler: handlers.registerButtonHandler,
    registerModalHandler: handlers.registerModalHandler,
    registerSelectHandler: handlers.registerSelectHandler,

    // Builders (re-export all)
    ...builders,

    // Flows (individual access)
    flows,

    // Convenience exports for common flows
    startGate1: flows.gate1Flow.startAwakening,
    startGate2: flows.gate2Flow.startMemory,
    startGate3: flows.gate3Flow.startConfession,
    startGate4: flows.gate4Flow.startWaters,
    startGate5: flows.gate5Flow.startAbsence,
    startGate6: flows.gate6Flow.startOffering,
    startGate7: flows.gate7Flow.startBinding,
    createSanctuaryMessage: flows.sanctuaryFlow.createSanctuaryMessage,
};
