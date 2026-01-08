/**
 * Central Select Menu Handler
 *
 * Routes all select menu interactions by customId prefix to appropriate handlers.
 */

// Handler registry - maps prefix to handler function
const handlers = {};

/**
 * Register a select menu handler for a prefix
 * @param {string} prefix - The customId prefix to match
 * @param {Function} handler - The handler function (interaction) => Promise
 */
function registerHandler(prefix, handler) {
    handlers[prefix] = handler;
}

/**
 * Handle a select menu interaction
 * @param {StringSelectMenuInteraction} interaction
 */
async function handleSelect(interaction) {
    const customId = interaction.customId;

    // Find matching handler by prefix
    for (const [prefix, handler] of Object.entries(handlers)) {
        if (customId.startsWith(prefix)) {
            try {
                await handler(interaction);
                return true;
            } catch (error) {
                console.error(`Select handler error (${prefix}):`, error);
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
    console.log(`Unhandled select menu: ${customId}`);
    return false;
}

/**
 * Initialize all select menu handlers
 * Called once on startup
 */
function initializeHandlers() {
    // Gate 1 select (phrase selection)
    registerHandler('gate1_', async (interaction) => {
        const gate1Flow = require('../flows/gate1Flow');
        await gate1Flow.handleSelect(interaction);
    });

    // Gate 4 select (answer selection)
    registerHandler('gate4_', async (interaction) => {
        const gate4Flow = require('../flows/gate4Flow');
        await gate4Flow.handleSelect(interaction);
    });

    // Gate 6 select (offering type)
    registerHandler('gate6_', async (interaction) => {
        const gate6Flow = require('../flows/gate6Flow');
        await gate6Flow.handleSelect(interaction);
    });

    // Admin handlers (delegate to adminPanel)
    registerHandler('admin_', async (interaction) => {
        const adminPanel = require('../../commands/adminPanel');
        await adminPanel.handleComponent(interaction);
    });

    console.log('✧ Select menu handlers initialized');
}

module.exports = {
    handleSelect,
    registerHandler,
    initializeHandlers,
};
