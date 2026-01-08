/**
 * Guild Create Event
 *
 * Triggers when the bot joins a new server.
 * Offers automatic setup or guides the admin.
 */

const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { runSetup, generateInviteUrl } = require('../utils/setup');
const config = require('../config');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`✧ Joined new server: ${guild.name} (${guild.id})`);

        // Find a channel to send the welcome message
        // Priority: system channel > first text channel we can send to
        let targetChannel = guild.systemChannel;

        if (!targetChannel || !targetChannel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)) {
            targetChannel = guild.channels.cache.find(
                ch => ch.type === 0 && // GuildText
                ch.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
            );
        }

        if (!targetChannel) {
            console.log('✧ Could not find a channel to send welcome message');
            return;
        }

        // Check if auto-setup is enabled
        const autoSetup = process.env.AUTO_SETUP_ON_JOIN === 'true';

        if (autoSetup) {
            // Run automatic setup
            await runAutoSetup(guild, targetChannel);
        } else {
            // Send welcome message with setup button
            await sendWelcomeEmbed(guild, targetChannel);
        }
    },
};

async function runAutoSetup(guild, channel) {
    const statusEmbed = new EmbedBuilder()
        .setTitle('♰ Seven Gates is Setting Up...')
        .setColor(0xff69b4)
        .setDescription('Creating channels, roles, and permissions automatically...');

    const statusMessage = await channel.send({ embeds: [statusEmbed] });

    try {
        const result = await runSetup(guild, { skipExisting: true });

        const successEmbed = new EmbedBuilder()
            .setTitle(result.success ? '✧ Seven Gates is Ready!' : '⚠ Setup Completed with Issues')
            .setColor(result.success ? 0xff69b4 : 0xffaa00)
            .setDescription(`
${result.success ? 'All channels and roles have been created.' : 'Setup completed but some items may need attention.'}

**Created:**
• ${Object.keys(result.roles).length} roles
• ${Object.keys(result.channels).length} channels

**To complete setup:**
1. Add puzzle answers to your \`.env\` file
2. Add Anthropic API key for Ika AI
3. Assign the **♱ Keeper** role to moderators

*The waiting room is open. Say "ika" to begin.*
            `.trim());

        if (result.channels.waitingRoom) {
            successEmbed.addFields({
                name: 'Start Here',
                value: `<#${result.channels.waitingRoom}>`,
            });
        }

        if (result.errors.length > 0) {
            successEmbed.addFields({
                name: '⚠ Errors',
                value: result.errors.slice(0, 3).join('\n'),
            });
        }

        await statusMessage.edit({ embeds: [successEmbed] });

    } catch (error) {
        console.error('Auto-setup failed:', error);

        const errorEmbed = new EmbedBuilder()
            .setTitle('⚠ Setup Failed')
            .setColor(0xff0000)
            .setDescription(`
Automatic setup encountered an error: ${error.message}

**Manual setup:**
Run \`/setup run\` to try again, or set up channels and roles manually.
            `.trim());

        await statusMessage.edit({ embeds: [errorEmbed] });
    }
}

async function sendWelcomeEmbed(guild, channel) {
    const embed = new EmbedBuilder()
        .setTitle('♰ Seven Gates Has Arrived ♰')
        .setColor(0xff69b4)
        .setDescription(`
*a presence stirs in the digital void...*

**Seven Gates** is a mystical puzzle experience where players complete seven trials to resurrect Ika, a faded idol trapped between worlds.

**To set up Seven Gates:**
Click the button below or run \`/setup run\`

This will automatically create:
• 10 channels (waiting room, 6 chambers, inner sanctum, archives)
• 10 roles (Lost Soul, Gate I-VII, Ascended, Keeper)
• All necessary permissions

*she's waiting...*
        `.trim())
        .setFooter({ text: 'Only server administrators can run setup' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('seven_gates_setup')
                .setLabel('✧ Run Setup')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('seven_gates_info')
                .setLabel('Learn More')
                .setStyle(ButtonStyle.Secondary),
        );

    const message = await channel.send({ embeds: [embed], components: [row] });

    // Create collector for button interactions
    const collector = message.createMessageComponentCollector({
        time: 3600000, // 1 hour
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'seven_gates_setup') {
            // Check if user is admin
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: 'only administrators can run setup.',
                    ephemeral: true,
                });
                return;
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const result = await runSetup(guild, { skipExisting: true });

                const resultEmbed = new EmbedBuilder()
                    .setTitle(result.success ? '✧ Setup Complete!' : '⚠ Setup Completed with Issues')
                    .setColor(result.success ? 0xff69b4 : 0xffaa00)
                    .setDescription(`
Created ${Object.keys(result.roles).length} roles and ${Object.keys(result.channels).length} channels.

${result.channels.waitingRoom ? `**Start here:** <#${result.channels.waitingRoom}>` : ''}

${result.errors.length > 0 ? `**Errors:**\n${result.errors.slice(0, 3).join('\n')}` : ''}

*The gates are ready. She's listening.*
                    `.trim());

                await interaction.editReply({ embeds: [resultEmbed] });

                // Update original message
                const doneEmbed = new EmbedBuilder()
                    .setTitle('✧ Seven Gates is Ready!')
                    .setColor(0xff69b4)
                    .setDescription(`Setup complete. Head to <#${result.channels.waitingRoom}> to begin.`);

                await message.edit({ embeds: [doneEmbed], components: [] });

            } catch (error) {
                await interaction.editReply({
                    content: `Setup failed: ${error.message}\n\nTry running \`/setup run\` manually.`,
                });
            }

        } else if (interaction.customId === 'seven_gates_info') {
            const infoEmbed = new EmbedBuilder()
                .setTitle('♰ About Seven Gates')
                .setColor(0xff69b4)
                .setDescription(`
**The Experience:**
Seven Gates is a narrative puzzle game wrapped in a Discord bot. Players complete increasingly difficult trials to "resurrect" Ika - a faded digital idol who exists between worlds.

**The Gates:**
1. **The Calling** - Say her name
2. **The Memory** - Remember what she lost
3. **The Confession** - Speak of her publicly
4. **The Waters** - Find where she sleeps
5. **The Absence** - Wait through her story
6. **The Offering** - Create something for her
7. **The Binding** - Speak your vow

**Features:**
• AI-powered Ika with memory and personality
• Progressive channel unlocks
• Community verification system
• ARG-style investigation mechanics
• Deep lore and secrets

**After Ascension:**
Devotion trials, whisper hunt, designed moments, and more await those who complete all seven gates.

*This is not a game. It's a ritual.*
                `.trim());

            await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
        }
    });
}
