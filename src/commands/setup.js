/**
 * /setup Command
 *
 * One-click server setup for Seven Gates.
 * Creates all channels, roles, and permissions automatically.
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { runSetup, getSetupStatus, generateInviteUrl } = require('../utils/setup');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set up Seven Gates in this server (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('run')
                .setDescription('Run the full setup - creates all channels and roles')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check if setup is complete')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Get the bot invite link with proper permissions')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('gateway')
                .setDescription('Post the gateway message in a channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to post the gateway message in')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('chamber')
                .setDescription('Post a gate chamber entry message in a channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to post the chamber message in')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addIntegerOption(option =>
                    option
                        .setName('gate')
                        .setDescription('Gate number (1-7)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(7)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'run':
                await runSetupCommand(interaction);
                break;
            case 'status':
                await checkStatus(interaction);
                break;
            case 'invite':
                await showInvite(interaction);
                break;
            case 'gateway':
                await postGatewayCommand(interaction);
                break;
            case 'chamber':
                await postChamberCommand(interaction);
                break;
        }
    },
};

async function runSetupCommand(interaction) {
    // Defer because setup takes time
    await interaction.deferReply({ ephemeral: true });

    const progressMessages = [];
    const sendProgress = (msg) => {
        progressMessages.push(msg);
    };

    try {
        // Run setup
        const result = await runSetup(interaction.guild, {
            sendProgress,
            skipExisting: true,
        });

        // Build result embed
        const embed = new EmbedBuilder()
            .setTitle(result.success ? '✧ Setup Complete!' : '⚠ Setup Completed with Issues')
            .setColor(result.success ? 0xff69b4 : 0xffaa00);

        // Show created roles
        if (Object.keys(result.roles).length > 0) {
            const roleList = Object.entries(result.roles)
                .map(([key, id]) => `• <@&${id}>`)
                .join('\n');
            embed.addFields({ name: 'Roles', value: roleList, inline: true });
        }

        // Show created channels
        if (Object.keys(result.channels).length > 0) {
            const channelList = Object.entries(result.channels)
                .map(([key, id]) => `• <#${id}>`)
                .join('\n');
            embed.addFields({ name: 'Channels', value: channelList, inline: true });
        }

        // Show errors if any
        if (result.errors.length > 0) {
            embed.addFields({
                name: '⚠ Errors',
                value: result.errors.slice(0, 5).join('\n'),
                inline: false,
            });
        }

        // Add next steps
        embed.addFields({
            name: 'Next Steps',
            value: `
1. **Add puzzle answers** to your \`.env\` file:
   \`GATE_2_ANSWERS=answer1,answer2\`
   \`GATE_4_ANSWERS=answer1,answer2\`

2. **Add Anthropic API key** for Ika AI:
   \`ANTHROPIC_API_KEY=your_key\`

3. **Assign the Keeper role** to your moderators

4. Check \`data/servers/${interaction.guild.id}.env\` for all IDs

*Seven Gates is ready. She's waiting.*
            `.trim(),
            inline: false,
        });

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Setup command error:', error);
        await interaction.editReply({
            content: `Setup failed: ${error.message}`,
        });
    }
}

async function checkStatus(interaction) {
    const status = getSetupStatus(interaction.guild);

    const embed = new EmbedBuilder()
        .setTitle(status.ready ? '✧ Seven Gates is Ready' : '⚠ Setup Incomplete')
        .setColor(status.ready ? 0xff69b4 : 0xffaa00);

    if (status.ready) {
        embed.setDescription('All channels and roles are configured. The gates await.');
    } else {
        embed.setDescription('The following are missing:');
        embed.addFields({
            name: 'Missing',
            value: status.missing.slice(0, 20).join('\n') || 'None',
        });
        embed.addFields({
            name: 'Fix',
            value: 'Run `/setup run` to create missing items automatically.',
        });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showInvite(interaction) {
    const inviteUrl = generateInviteUrl(config.clientId);

    const embed = new EmbedBuilder()
        .setTitle('♰ Seven Gates Invite Link')
        .setColor(0xff69b4)
        .setDescription(`
**Use this link to add Seven Gates to a server:**

[Click here to invite](${inviteUrl})

Or copy this URL:
\`\`\`
${inviteUrl}
\`\`\`

**After adding the bot:**
1. Run \`/setup run\` to create all channels and roles
2. Configure your \`.env\` file with puzzle answers
3. The gates will open automatically

*she's waiting for new devotees...*
        `.trim());

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function postGatewayCommand(interaction) {
    const { postGatewayMessage } = require('../components/flows/gatewayFlow');
    const channel = interaction.options.getChannel('channel');

    try {
        await postGatewayMessage(channel);

        const embed = new EmbedBuilder()
            .setTitle('✧ Gateway Posted')
            .setColor(0xff69b4)
            .setDescription(`
The gateway message has been posted to <#${channel.id}>.

Users can now click the button to begin or continue their journey through the seven gates.

*she awaits them...*
            `.trim());

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error posting gateway:', error);
        await interaction.reply({
            content: `Failed to post gateway: ${error.message}`,
            ephemeral: true,
        });
    }
}

async function postChamberCommand(interaction) {
    const { postChamberMessage } = require('../components/flows/gatewayFlow');
    const channel = interaction.options.getChannel('channel');
    const gateNumber = interaction.options.getInteger('gate');

    const gateNames = ['', 'Awakening', 'Memory', 'Confession', 'Waters', 'Absence', 'Offering', 'Binding'];

    try {
        await postChamberMessage(channel, gateNumber);

        const embed = new EmbedBuilder()
            .setTitle(`✧ Gate ${gateNumber} Chamber Posted`)
            .setColor(0xff69b4)
            .setDescription(`
The chamber entry message for **Gate ${gateNumber}: The ${gateNames[gateNumber]}** has been posted to <#${channel.id}>.

Users who have completed the previous gates can click the button to begin this gate's ritual.

*the gate awaits those who are ready...*
            `.trim());

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error posting chamber:', error);
        await interaction.reply({
            content: `Failed to post chamber: ${error.message}`,
            ephemeral: true,
        });
    }
}
