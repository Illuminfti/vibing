/**
 * Central Button Handler
 *
 * Routes all button interactions by customId prefix to appropriate handlers.
 * This enables persistent buttons that work forever (not relying on collectors).
 */

const { RitualEmbedBuilder } = require('../../ui');

// Handler registry - maps prefix to handler function
const handlers = {};

/**
 * Register a button handler for a prefix
 * @param {string} prefix - The customId prefix to match
 * @param {Function} handler - The handler function (interaction) => Promise
 */
function registerHandler(prefix, handler) {
    handlers[prefix] = handler;
}

/**
 * Handle a button interaction
 * @param {ButtonInteraction} interaction
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    // Find matching handler by prefix
    for (const [prefix, handler] of Object.entries(handlers)) {
        if (customId.startsWith(prefix)) {
            try {
                await handler(interaction);
                return true;
            } catch (error) {
                console.error(`Button handler error (${prefix}):`, error);
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
    console.log(`Unhandled button: ${customId}`);
    return false;
}

/**
 * Initialize all button handlers
 * Called once on startup
 */
function initializeHandlers() {
    // Gate 1 handlers
    registerHandler('gate1_', async (interaction) => {
        const gate1Flow = require('../flows/gate1Flow');
        await gate1Flow.handleButton(interaction);
    });

    // Gate 2 handlers
    registerHandler('gate2_', async (interaction) => {
        const gate2Flow = require('../flows/gate2Flow');
        await gate2Flow.handleButton(interaction);
    });

    // Gate 3 handlers
    registerHandler('gate3_', async (interaction) => {
        const gate3Flow = require('../flows/gate3Flow');
        await gate3Flow.handleButton(interaction);
    });

    // Gate 4 handlers
    registerHandler('gate4_', async (interaction) => {
        const gate4Flow = require('../flows/gate4Flow');
        await gate4Flow.handleButton(interaction);
    });

    // Gate 5 handlers
    registerHandler('gate5_', async (interaction) => {
        const gate5Flow = require('../flows/gate5Flow');
        await gate5Flow.handleButton(interaction);
    });

    // Gate 6 handlers
    registerHandler('gate6_', async (interaction) => {
        const gate6Flow = require('../flows/gate6Flow');
        await gate6Flow.handleButton(interaction);
    });

    // Gate 7 handlers
    registerHandler('gate7_', async (interaction) => {
        const gate7Flow = require('../flows/gate7Flow');
        await gate7Flow.handleButton(interaction);
    });

    // Sanctuary handlers (persistent)
    registerHandler('sanctuary_', async (interaction) => {
        const sanctuaryFlow = require('../flows/sanctuaryFlow');
        await sanctuaryFlow.handleButton(interaction);
    });

    // Reaction handlers
    registerHandler('react_', async (interaction) => {
        const reactionFlow = require('../flows/reactionFlow');
        await reactionFlow.handleButton(interaction);
    });

    // Gateway handlers (main user entry point - button-based flow)
    registerHandler('gateway_', async (interaction) => {
        const gatewayFlow = require('../flows/gatewayFlow');
        await gatewayFlow.handleButton(interaction);
    });

    // Admin handlers (delegate to adminPanel)
    registerHandler('admin_', async (interaction) => {
        const adminPanel = require('../../commands/adminPanel');
        await adminPanel.handleComponent(interaction);
    });

    console.log('✧ Button handlers initialized');
}

module.exports = {
    handleButton,
    registerHandler,
    initializeHandlers,
};
