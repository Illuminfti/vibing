/**
 * Central Modal Handler
 *
 * Routes all modal submissions by customId prefix to appropriate handlers.
 */

// Handler registry - maps prefix to handler function
const handlers = {};

/**
 * Register a modal handler for a prefix
 * @param {string} prefix - The customId prefix to match
 * @param {Function} handler - The handler function (interaction) => Promise
 */
function registerHandler(prefix, handler) {
    handlers[prefix] = handler;
}

/**
 * Handle a modal submit interaction
 * @param {ModalSubmitInteraction} interaction
 */
async function handleModal(interaction) {
    const customId = interaction.customId;

    // Find matching handler by prefix
    for (const [prefix, handler] of Object.entries(handlers)) {
        if (customId.startsWith(prefix)) {
            try {
                await handler(interaction);
                return true;
            } catch (error) {
                console.error(`Modal handler error (${prefix}):`, error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'something went wrong...',
                        ephemeral: true,
                    });
                }
                return false;
            }
        }
    }

    // No handler found
    console.log(`Unhandled modal: ${customId}`);
    return false;
}

/**
 * Initialize all modal handlers
 * Called once on startup
 */
function initializeHandlers() {
    // Gate 2 modal (memory answer)
    registerHandler('gate2_', async (interaction) => {
        const gate2Flow = require('../flows/gate2Flow');
        await gate2Flow.handleModal(interaction);
    });

    // Gate 3 modal (confession)
    registerHandler('gate3_', async (interaction) => {
        const gate3Flow = require('../flows/gate3Flow');
        await gate3Flow.handleModal(interaction);
    });

    // Gate 5 modal (absence reason)
    registerHandler('gate5_', async (interaction) => {
        const gate5Flow = require('../flows/gate5Flow');
        await gate5Flow.handleModal(interaction);
    });

    // Gate 6 modal (offering words)
    registerHandler('gate6_', async (interaction) => {
        const gate6Flow = require('../flows/gate6Flow');
        await gate6Flow.handleModal(interaction);
    });

    // Gate 7 modals (entry confirmation, vow)
    registerHandler('gate7_', async (interaction) => {
        const gate7Flow = require('../flows/gate7Flow');
        await gate7Flow.handleModal(interaction);
    });

    // Sanctuary modal (speak to Ika)
    registerHandler('sanctuary_', async (interaction) => {
        const sanctuaryFlow = require('../flows/sanctuaryFlow');
        await sanctuaryFlow.handleModal(interaction);
    });

    console.log('✧ Modal handlers initialized');
}

module.exports = {
    handleModal,
    registerHandler,
    initializeHandlers,
};
