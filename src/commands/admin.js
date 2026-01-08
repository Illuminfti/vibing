const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');
const messages = require('../assets/messages');
const { userOps, gate5Ops, offeringOps, vowOps } = require('../database');
const { assignGateRole, removeAllGateRoles, assignAscendedRole, hasRole, getMembersWithRole } = require('../utils/roles');
const { createGateEmbed } = require('../utils/embeds');
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
        // Check for mod role
        if (!hasRole(interaction.member, config.roles.mod)) {
            const embed = createGateEmbed(null, 'you lack the authority for this.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
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

    const embed = new EmbedBuilder()
        .setTitle('♰ admin stats ♰')
        .setDescription(text)
        .setColor(config.colors.primary);

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

    const embed = createGateEmbed(null, messages.admin.resetSuccess(user.username));
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

    const embed = createGateEmbed(null, messages.admin.advanceSuccess(user.username, gate));
    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log(`✧ admin ${interaction.user.tag} advanced ${user.tag} to gate ${gate}`);
}

async function handleApprove(interaction) {
    const user = interaction.options.getUser('user');

    // Check for pending offering
    const pendingOffering = offeringOps.getPending(user.id);
    if (pendingOffering) {
        await approveOffering(interaction.client, user.id, interaction.user.id, pendingOffering.message_id);
        const embed = createGateEmbed(null, messages.admin.approveSuccess(user.username) + ' (gate 6 offering)');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check for pending vow
    const pendingVow = vowOps.getPending(user.id);
    if (pendingVow) {
        await approveVow(interaction.client, user.id, interaction.user.id, pendingVow.message_id);
        const embed = createGateEmbed(null, messages.admin.approveSuccess(user.username) + ' (gate 7 vow)');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = createGateEmbed(null, `${user.username} has no pending submissions.`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleTestMode(interaction) {
    const enabled = interaction.options.getBoolean('enabled');

    // Update config (note: this won't persist across restarts)
    config.testMode = enabled;

    const embed = createGateEmbed(null, enabled ? messages.admin.testModeOn : messages.admin.testModeOff);
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
            const embed = createGateEmbed(null, message);
            await member.user.send({ embeds: [embed] });
            sent++;
        } catch {
            failed++;
        }
    }

    const embed = createGateEmbed(null, `broadcast complete.\nsent: ${sent}\nfailed: ${failed}`);
    await interaction.editReply({ embeds: [embed] });

    console.log(`✧ admin ${interaction.user.tag} broadcast to gate ${gate}: ${sent} sent, ${failed} failed`);
}
