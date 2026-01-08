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

        // Handle button interactions (if any)
        if (interaction.isButton()) {
            await handleButton(interaction);
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
    // Reserved for future button interactions
    console.log(`Button interaction: ${interaction.customId}`);
}
