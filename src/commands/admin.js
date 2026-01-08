const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const messages = require('../assets/messages');
const { userOps, gate5Ops, offeringOps, vowOps } = require('../database');
const { assignGateRole, removeAllGateRoles, assignAscendedRole, hasRole, getMembersWithRole } = require('../utils/roles');
const { RitualEmbedBuilder, createIkaEmbed } = require('../ui');
const { formatDuration } = require('../utils/timing');
const { approveOffering } = require('../gates/gate6');
const { approveVow } = require('../gates/gate7');
const { startGate5Sequence } = require('../gates/gate4');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('administrative commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('show all admin commands and testing guide')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('view detailed statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('reset a user\'s progress')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('user to reset')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('advance')
                .setDescription('advance a user to a specific gate')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('user to advance')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('gate')
                        .setDescription('gate number to advance to (1-7)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(7)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('approve')
                .setDescription('manually approve a pending submission')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('user whose submission to approve')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('testmode')
                .setDescription('toggle test mode for Gate 5')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('enable or disable test mode')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('broadcast')
                .setDescription('send a message to all users at a specific gate')
                .addIntegerOption(option =>
                    option
                        .setName('gate')
                        .setDescription('gate number (1-7)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(7)
                )
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('message to send')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        // Check for mod role OR Discord Administrator permission
        // This allows server admins to use commands even without MOD_ROLE_ID configured
        const isDiscordAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const hasModRole = config.roles.mod && hasRole(interaction.member, config.roles.mod);

        if (!isDiscordAdmin && !hasModRole) {
            const embed = new RitualEmbedBuilder('failure', { mood: 'normal' })
                .setRitualDescription('you lack the authority for this.', false)
                .build();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'help':
                await handleHelp(interaction);
                break;
            case 'stats':
                await handleStats(interaction);
                break;
            case 'reset':
                await handleReset(interaction);
                break;
            case 'advance':
                await handleAdvance(interaction);
                break;
            case 'approve':
                await handleApprove(interaction);
                break;
            case 'testmode':
                await handleTestMode(interaction);
                break;
            case 'broadcast':
                await handleBroadcast(interaction);
                break;
        }
    },
};

async function handleHelp(interaction) {
    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('♰ Admin Commands ♰')
        .setRitualDescription(`Welcome to the Seven Gates admin system. Here are all available commands.\n\n` +
            `**Quick Tip:** Use \`/admin-panel\` for the advanced testing interface with buttons & menus!`, false)
        .addRitualField('📊 `/admin stats`',
            'View detailed server statistics:\n• Total users & ascended count\n• Gate completion numbers\n• First completions & avg time')
        .addRitualField('🔄 `/admin reset <user>`',
            'Reset a user\'s progress completely:\n• Removes all gate roles\n• Clears database records\n• Use for fresh start testing')
        .addRitualField('⏭️ `/admin advance <user> <gate>`',
            'Advance user to specific gate (1-7):\n• Assigns all roles up to that gate\n• Marks previous gates complete\n• Gate 4 starts Gate 5 sequence\n• Gate 7 ascends the user')
        .addRitualField('✅ `/admin approve <user>`',
            'Manually approve pending submissions:\n• Gate 6 offerings\n• Gate 7 vows\n• Bypasses community voting')
        .addRitualField('🧪 `/admin testmode <true/false>`',
            'Toggle test mode for Gate 5:\n• Reduces timer from 3min to 10sec\n• Useful for quick testing')
        .addRitualField('📢 `/admin broadcast <gate> <message>`',
            'Send message to all users at a gate:\n• DMs all users with that gate role\n• Uses gate-specific theming')
        .addRitualField('🔧 `/admin-panel` (Separate Command)',
            'Advanced testing panel with:\n• Trigger rare events & moods\n• Control gate progression\n• Inspect user state\n• Test mode toggles\n• Time manipulation\n• Quick test presets')
        .setRitualFooter('You have admin access • Use responsibly')
        .addTimestamp()
        .build();

    embed.setColor(0x9B59B6);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleStats(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const stats = userOps.getStats();
    const firsts = userOps.getFirsts();
    const avgTime = userOps.getAverageTime();

    let text = '**detailed statistics**\n\n';
    text += `total users: ${stats.total}\n`;
    text += `ascended: ${stats.ascended}\n\n`;

    text += '**gate completion:**\n';
    for (let i = 1; i <= 7; i++) {
        text += `gate ${i}: ${stats[`gate${i}`]}\n`;
    }

    if (avgTime > 0) {
        text += `\n**avg completion time:** ${formatDuration(Math.floor(avgTime))}`;
    }

    text += '\n\n**first completions:**\n';
    for (const first of firsts) {
        text += `gate ${first.gate_number}: ${first.username}\n`;
    }

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('♰ admin stats ♰')
        .setRitualDescription(text, false)
        .build();

    await interaction.editReply({ embeds: [embed] });
}

async function handleReset(interaction) {
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id);

    // Remove all roles
    await removeAllGateRoles(member);

    // Clear database
    userOps.reset(user.id);
    gate5Ops.clear(user.id);

    const embed = new RitualEmbedBuilder('ritual', { mood: 'normal' })
        .setRitualDescription(messages.admin.resetSuccess(user.username), false)
        .build();
    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log(`✧ admin ${interaction.user.tag} reset ${user.tag}`);
}

async function handleAdvance(interaction) {
    const user = interaction.options.getUser('user');
    const gate = interaction.options.getInteger('gate');
    const member = await interaction.guild.members.fetch(user.id);

    // Ensure user exists in database
    userOps.getOrCreate(user.id, user.username);

    // Assign all roles up to and including the specified gate
    for (let i = 1; i <= gate; i++) {
        await assignGateRole(member, i);

        // Complete gate in database if not already
        if (!userOps.hasCompletedGate(user.id, i)) {
            userOps.completeGate(user.id, i);
        }
    }

    // If advanced to gate 4, start gate 5 sequence
    if (gate === 4) {
        startGate5Sequence(user.id);
    }

    // If gate 7, also assign ascended
    if (gate === 7) {
        await assignAscendedRole(member);
        userOps.ascend(user.id);
    }

    const embed = new RitualEmbedBuilder('ritual', { mood: 'normal' })
        .setRitualDescription(messages.admin.advanceSuccess(user.username, gate), false)
        .build();
    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log(`✧ admin ${interaction.user.tag} advanced ${user.tag} to gate ${gate}`);
}

async function handleApprove(interaction) {
    const user = interaction.options.getUser('user');

    // Check for pending offering
    const pendingOffering = offeringOps.getPending(user.id);
    if (pendingOffering) {
        await approveOffering(interaction.client, user.id, interaction.user.id, pendingOffering.message_id);
        const embed = new RitualEmbedBuilder('ritual', { mood: 'normal' })
            .setRitualDescription(messages.admin.approveSuccess(user.username) + ' (gate 6 offering)', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for pending vow
    const pendingVow = vowOps.getPending(user.id);
    if (pendingVow) {
        await approveVow(interaction.client, user.id, interaction.user.id, pendingVow.message_id);
        const embed = new RitualEmbedBuilder('ritual', { mood: 'normal' })
            .setRitualDescription(messages.admin.approveSuccess(user.username) + ' (gate 7 vow)', false)
            .build();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new RitualEmbedBuilder('failure', { mood: 'normal' })
        .setRitualDescription(`${user.username} has no pending submissions.`, false)
        .build();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleTestMode(interaction) {
    const enabled = interaction.options.getBoolean('enabled');

    // Update config (note: this won't persist across restarts)
    config.testMode = enabled;

    const embed = new RitualEmbedBuilder('ritual', { mood: 'normal' })
        .setRitualDescription(enabled ? messages.admin.testModeOn : messages.admin.testModeOff, false)
        .build();
    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log(`✧ admin ${interaction.user.tag} set test mode to ${enabled}`);
}

async function handleBroadcast(interaction) {
    const gate = interaction.options.getInteger('gate');
    const message = interaction.options.getString('message');

    await interaction.deferReply({ ephemeral: true });

    const roleId = config.gateRoles[gate];
    const members = await getMembersWithRole(interaction.guild, roleId);

    let sent = 0;
    let failed = 0;

    for (const member of members) {
        try {
            // Use gate-specific theming for broadcast messages
            const embed = new RitualEmbedBuilder(gate, { mood: 'normal' })
                .setRitualDescription(message, false)
                .build();
            await member.user.send({ embeds: [embed] });
            sent++;
        } catch {
            failed++;
        }
    }

    const embed = new RitualEmbedBuilder('ritual', { mood: 'normal' })
        .setRitualDescription(`broadcast complete.\nsent: ${sent}\nfailed: ${failed}`, false)
        .build();
    await interaction.editReply({ embeds: [embed] });

    console.log(`✧ admin ${interaction.user.tag} broadcast to gate ${gate}: ${sent} sent, ${failed} failed`);
}
