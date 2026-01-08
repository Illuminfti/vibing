const { Events, InteractionType } = require('discord.js');
const { createGateEmbed } = require('../utils/embeds');
const messages = require('../assets/messages');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
            return;
        }

        // Handle button interactions
        if (interaction.isButton()) {
            await handleButton(interaction);
            return;
        }

        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
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

        const errorEmbed = createGateEmbed(null, messages.errors.generic);

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
async function handleButton(interaction) {
    const customId = interaction.customId;

    // Admin panel buttons
    if (customId.startsWith('admin_')) {
        try {
            const adminPanel = require('../commands/adminPanel');
            await adminPanel.handleComponent(interaction);
        } catch (error) {
            console.error('Error handling admin panel button:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Error processing action', ephemeral: true });
            }
        }
        return;
    }

    // Other button handlers can be added here
    console.log(`Unhandled button interaction: ${customId}`);
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenu(interaction) {
    const customId = interaction.customId;

    // Admin panel select menus
    if (customId.startsWith('admin_')) {
        try {
            const adminPanel = require('../commands/adminPanel');
            await adminPanel.handleComponent(interaction);
        } catch (error) {
            console.error('Error handling admin panel select:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Error processing selection', ephemeral: true });
            }
        }
        return;
    }

    // Other select menu handlers can be added here
    console.log(`Unhandled select menu interaction: ${customId}`);
}
