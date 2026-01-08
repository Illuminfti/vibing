/**
 * Component Handlers Index
 *
 * Exports all handlers and provides initialization function.
 */

const buttonHandler = require('./buttonHandler');
const modalHandler = require('./modalHandler');
const selectHandler = require('./selectHandler');

/**
 * Initialize all component handlers
 * Call this once during bot startup
 */
function initializeAllHandlers() {
    buttonHandler.initializeHandlers();
    modalHandler.initializeHandlers();
    selectHandler.initializeHandlers();
    console.log('✧ All component handlers initialized');
}

module.exports = {
    // Handler functions
    handleButton: buttonHandler.handleButton,
    handleModal: modalHandler.handleModal,
    handleSelect: selectHandler.handleSelect,

    // Registration (for dynamic handler addition)
    registerButtonHandler: buttonHandler.registerHandler,
    registerModalHandler: modalHandler.registerHandler,
    registerSelectHandler: selectHandler.registerHandler,

    // Initialization
    initializeAllHandlers,
};
