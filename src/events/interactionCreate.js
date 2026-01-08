/**
 * Interaction Create Event Handler
 *
 * Routes all Discord interactions to appropriate handlers.
 * Supports: slash commands, buttons, modals, and select menus.
 */

const { Events } = require('discord.js');
const { RitualEmbedBuilder } = require('../ui');
const messages = require('../assets/messages');
const {
    handleButton,
    handleModal,
    handleSelect,
    initializeAllHandlers,
} = require('../components/handlers');

// Initialize component handlers on first load
let handlersInitialized = false;

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        // Initialize handlers on first interaction
        if (!handlersInitialized) {
            initializeAllHandlers();
            handlersInitialized = true;
        }

        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
            return;
        }

        // Handle button interactions
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
            return;
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            await handleModalInteraction(interaction);
            return;
        }

        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            await handleSelectInteraction(interaction);
            return;
        }
    },
};

/**
 * Handle slash command interactions
 */
async function handleSlashCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Command ${interaction.commandName} not found`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);

        // Use the failure theme for error messages
        const errorEmbed = new RitualEmbedBuilder('failure', { mood: 'normal' })
            .setRitualDescription(messages.errors?.generic || 'something went wrong...', false)
            .build();

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

/**
 * Handle button interactions
 */
async function handleButtonInteraction(interaction) {
    try {
        const handled = await handleButton(interaction);
        if (!handled) {
            console.log(`Unhandled button: ${interaction.customId}`);
        }
    } catch (error) {
        console.error('Error handling button:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '*something went wrong...*',
                ephemeral: true,
            });
        }
    }
}

/**
 * Handle modal submissions
 */
async function handleModalInteraction(interaction) {
    try {
        const handled = await handleModal(interaction);
        if (!handled) {
            console.log(`Unhandled modal: ${interaction.customId}`);
        }
    } catch (error) {
        console.error('Error handling modal:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '*something went wrong...*',
                ephemeral: true,
            });
        }
    }
}

/**
 * Handle select menu interactions
 */
async function handleSelectInteraction(interaction) {
    try {
        const handled = await handleSelect(interaction);
        if (!handled) {
            console.log(`Unhandled select: ${interaction.customId}`);
        }
    } catch (error) {
        console.error('Error handling select:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '*something went wrong...*',
                ephemeral: true,
            });
        }
    }
}
