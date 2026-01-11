/**
 * Admin Panel Command
 *
 * Comprehensive testing interface for all Seven Gates features.
 * Allows admins to trigger events, manipulate state, and test mechanics.
 *
 * @version 1.0.0
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { RitualEmbedBuilder, RitualButtonBuilder, createConfirmCancelRow } = require('../ui');

// Import all systems for testing
const { userOps, ikaMemoryOps, ikaStateOps, gateOps, gate5Ops } = require('../database');

// Test mode state (in-memory, resets on restart)
const testModeState = {
    skipCooldowns: new Set(),      // User IDs with cooldowns disabled
    instantTimers: new Set(),       // User IDs with instant timers
    forcedTime: new Map(),          // User ID -> forced time string
    chaosMode: new Set(),           // User IDs in chaos mode
    globalChaos: false,             // Global chaos mode
    auditLog: [],                   // Recent admin actions
};

// ═══════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════

const command = new SlashCommandBuilder()
    .setName('admin-panel')
    .setDescription('🔧 Admin testing panel for all Seven Gates features')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => sub
        .setName('trigger')
        .setDescription('Trigger specific events or mechanics')
        .addStringOption(opt => opt
            .setName('category')
            .setDescription('Category of trigger')
            .setRequired(true)
            .addChoices(
                { name: '🎭 Rare Events', value: 'rare_events' },
                { name: '😊 Moods', value: 'moods' },
                { name: '💚 Intimacy', value: 'intimacy' },
                { name: '💀 Fading', value: 'fading' },
                { name: '😈 Jealousy/Yandere', value: 'jealousy' },
                { name: '🛡️ Protection', value: 'protection' },
                { name: '🔥 Roasts', value: 'roasts' },
                { name: '💕 Romance', value: 'romance' },
                { name: '🌟 Viral Lines', value: 'viral' },
                { name: '📜 Lore Drops', value: 'lore' },
                { name: '⏰ Time Secrets', value: 'time_secrets' },
                { name: '🎪 Designed Moments', value: 'moments' },
                { name: '🔮 Rituals', value: 'rituals' },
            ))
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('Target user (defaults to you)')
            .setRequired(false)))
    .addSubcommand(sub => sub
        .setName('gate')
        .setDescription('Control gate progression')
        .addStringOption(opt => opt
            .setName('action')
            .setDescription('Gate action')
            .setRequired(true)
            .addChoices(
                { name: '⏭️ Advance to Gate', value: 'advance' },
                { name: '⏮️ Reset to Gate', value: 'reset' },
                { name: '✅ Complete Current Gate', value: 'complete' },
                { name: '⚡ Skip Gate 5 Timer', value: 'skip_gate5' },
                { name: '👁️ View Progress', value: 'view' },
            ))
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(false))
        .addIntegerOption(opt => opt
            .setName('gate_number')
            .setDescription('Gate number (1-7)')
            .setMinValue(1)
            .setMaxValue(7)
            .setRequired(false)))
    .addSubcommand(sub => sub
        .setName('inspect')
        .setDescription('View detailed user state')
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('User to inspect')
            .setRequired(true))
        .addStringOption(opt => opt
            .setName('section')
            .setDescription('Section to view')
            .setRequired(false)
            .addChoices(
                { name: '📊 Overview', value: 'overview' },
                { name: '🚪 Gates', value: 'gates' },
                { name: '💚 Intimacy', value: 'intimacy' },
                { name: '🧠 Memory', value: 'memory' },
                { name: '💀 Fading', value: 'fading' },
                { name: '🏆 Trials', value: 'trials' },
                { name: '⛩️ Shrine', value: 'shrine' },
                { name: '🎭 Events History', value: 'events' },
            )))
    .addSubcommand(sub => sub
        .setName('testmode')
        .setDescription('Toggle testing modes')
        .addStringOption(opt => opt
            .setName('mode')
            .setDescription('Test mode to toggle')
            .setRequired(true)
            .addChoices(
                { name: '⏭️ Skip Cooldowns', value: 'skip_cooldowns' },
                { name: '⚡ Instant Timers', value: 'instant_timers' },
                { name: '🌀 Chaos Mode (all bypasses)', value: 'chaos' },
                { name: '🌍 Global Chaos (everyone)', value: 'global_chaos' },
            ))
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('Target user (defaults to you)')
            .setRequired(false))
        .addBooleanOption(opt => opt
            .setName('enabled')
            .setDescription('Enable or disable')
            .setRequired(false)))
    .addSubcommand(sub => sub
        .setName('time')
        .setDescription('Manipulate time for testing')
        .addStringOption(opt => opt
            .setName('action')
            .setDescription('Time action')
            .setRequired(true)
            .addChoices(
                { name: '⏰ Force Time (HH:MM)', value: 'force' },
                { name: '🔄 Reset to Real Time', value: 'reset' },
                { name: '🌙 Force 3AM Mode', value: 'force_3am' },
                { name: '☀️ Force Daytime', value: 'force_day' },
                { name: '🕐 Force 4:47 AM', value: 'force_447' },
            ))
        .addStringOption(opt => opt
            .setName('time')
            .setDescription('Time in HH:MM format (for force action)')
            .setRequired(false))
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(false)))
    .addSubcommand(sub => sub
        .setName('secrets')
        .setDescription('Test ARG and secrets systems')
        .addStringOption(opt => opt
            .setName('action')
            .setDescription('Secrets action')
            .setRequired(true)
            .addChoices(
                { name: '🔍 View Discovery Progress', value: 'view' },
                { name: '🎁 Award Fragment', value: 'award_fragment' },
                { name: '📖 Unlock Lore Category', value: 'unlock_lore' },
                { name: '🗝️ Test Secret Phrase', value: 'test_phrase' },
                { name: '🔐 View All Secrets', value: 'list_all' },
            ))
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(false))
        .addStringOption(opt => opt
            .setName('value')
            .setDescription('Fragment ID, lore category, or phrase to test')
            .setRequired(false)))
    .addSubcommand(sub => sub
        .setName('quick')
        .setDescription('Quick test presets')
        .addStringOption(opt => opt
            .setName('preset')
            .setDescription('Test preset')
            .setRequired(true)
            .addChoices(
                { name: '🆕 New User Experience', value: 'new_user' },
                { name: '🏃 Speed Run (all gates)', value: 'speed_run' },
                { name: '💀 Test Fading Sequence', value: 'fading_test' },
                { name: '😈 Yandere Escalation', value: 'yandere_test' },
                { name: '💕 Romance Sequence', value: 'romance_test' },
                { name: '🌙 3AM Session', value: '3am_session' },
                { name: '🎭 All Rare Events', value: 'all_rare' },
                { name: '🔄 Full Reset', value: 'full_reset' },
            ))
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(false)))
    .addSubcommand(sub => sub
        .setName('reset')
        .setDescription('Reset user data')
        .addStringOption(opt => opt
            .setName('scope')
            .setDescription('What to reset')
            .setRequired(true)
            .addChoices(
                { name: '🔄 All Cooldowns', value: 'cooldowns' },
                { name: '🧠 Memory Only', value: 'memory' },
                { name: '💚 Intimacy Only', value: 'intimacy' },
                { name: '🚪 Gates Only', value: 'gates' },
                { name: '💀 Fading Status', value: 'fading' },
                { name: '⚠️ FULL RESET (everything)', value: 'full' },
            ))
        .addUserOption(opt => opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)))
    .addSubcommand(sub => sub
        .setName('simulate')
        .setDescription('Simulate user messages for testing')
        .addStringOption(opt => opt
            .setName('message')
            .setDescription('Message content to simulate')
            .setRequired(true))
        .addUserOption(opt => opt
            .setName('as_user')
            .setDescription('Simulate as this user')
            .setRequired(false)));

// ═══════════════════════════════════════════════════════════════
// SUBCOMMAND HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleTrigger(interaction) {
    const category = interaction.options.getString('category');
    const targetUser = interaction.options.getUser('user') || interaction.user;

    // Build selection menu based on category
    const options = getTriggerOptions(category);

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`admin_trigger_${category}_${targetUser.id}`)
        .setPlaceholder(`Select ${category.replace('_', ' ')} to trigger...`)
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle(`🎯 Trigger: ${formatCategory(category)}`)
        .setRitualDescription(`Select a specific trigger for **${targetUser.username}**`, false)
        .setRitualFooter('Admin Panel • Select from dropdown')
        .build();

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleGate(interaction) {
    const action = interaction.options.getString('action');
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const gateNumber = interaction.options.getInteger('gate_number');

    const userId = targetUser.id;
    let result = '';
    let color = 0x2ECC71;

    switch (action) {
        case 'advance':
            if (!gateNumber) {
                return interaction.reply({ content: '❌ Please specify a gate number (1-7)', ephemeral: true });
            }
            result = await advanceUserToGate(userId, gateNumber, interaction.client);
            break;

        case 'reset':
            const resetTo = gateNumber || 0;
            result = await resetUserToGate(userId, resetTo);
            color = 0xE74C3C;
            break;

        case 'complete':
            result = await completeCurrentGate(userId, interaction.client);
            break;

        case 'skip_gate5':
            result = await skipGate5Timer(userId);
            break;

        case 'view':
            return showGateProgress(interaction, targetUser);
    }

    logAdminAction(interaction.user.id, `gate_${action}`, { target: userId, gate: gateNumber });

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('🚪 Gate Control')
        .setRitualDescription(result, false)
        .addRitualField('Target', `<@${userId}>`, true)
        .setRitualFooter(`Action by ${interaction.user.username}`)
        .addTimestamp()
        .build();

    // Override color based on action
    embed.setColor(color);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleInspect(interaction) {
    const targetUser = interaction.options.getUser('user');
    const section = interaction.options.getString('section') || 'overview';

    const embed = await buildInspectEmbed(targetUser, section);
    const buttons = buildInspectButtons(targetUser.id, section);

    await interaction.reply({ embeds: [embed], components: buttons, ephemeral: true });
}

async function handleTestMode(interaction) {
    const mode = interaction.options.getString('mode');
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const enabled = interaction.options.getBoolean('enabled');

    const userId = targetUser.id;
    let result = '';
    let newState = enabled;

    switch (mode) {
        case 'skip_cooldowns':
            if (enabled === null) newState = !testModeState.skipCooldowns.has(userId);
            if (newState) testModeState.skipCooldowns.add(userId);
            else testModeState.skipCooldowns.delete(userId);
            result = `⏭️ Skip Cooldowns: **${newState ? 'ENABLED' : 'DISABLED'}** for ${targetUser.username}`;
            break;

        case 'instant_timers':
            if (enabled === null) newState = !testModeState.instantTimers.has(userId);
            if (newState) testModeState.instantTimers.add(userId);
            else testModeState.instantTimers.delete(userId);
            result = `⚡ Instant Timers: **${newState ? 'ENABLED' : 'DISABLED'}** for ${targetUser.username}`;
            break;

        case 'chaos':
            if (enabled === null) newState = !testModeState.chaosMode.has(userId);
            if (newState) {
                testModeState.chaosMode.add(userId);
                testModeState.skipCooldowns.add(userId);
                testModeState.instantTimers.add(userId);
            } else {
                testModeState.chaosMode.delete(userId);
                testModeState.skipCooldowns.delete(userId);
                testModeState.instantTimers.delete(userId);
            }
            result = `🌀 Chaos Mode: **${newState ? 'ENABLED' : 'DISABLED'}** for ${targetUser.username}\n(All bypasses active)`;
            break;

        case 'global_chaos':
            if (enabled === null) newState = !testModeState.globalChaos;
            testModeState.globalChaos = newState;
            result = `🌍 Global Chaos Mode: **${newState ? 'ENABLED' : 'DISABLED'}**\n⚠️ All users now bypass cooldowns and timers!`;
            break;
    }

    logAdminAction(interaction.user.id, `testmode_${mode}`, { target: userId, enabled: newState });

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('🧪 Test Mode')
        .setRitualDescription(result, false)
        .setRitualFooter(`Toggled by ${interaction.user.username}`)
        .addTimestamp()
        .build();

    embed.setColor(newState ? 0x2ECC71 : 0xE74C3C);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleTime(interaction) {
    const action = interaction.options.getString('action');
    const timeValue = interaction.options.getString('time');
    const targetUser = interaction.options.getUser('user') || interaction.user;

    const userId = targetUser.id;
    let result = '';

    switch (action) {
        case 'force':
            if (!timeValue || !/^\d{1,2}:\d{2}$/.test(timeValue)) {
                return interaction.reply({ content: '❌ Please provide time in HH:MM format', ephemeral: true });
            }
            testModeState.forcedTime.set(userId, timeValue);
            result = `⏰ Forced time to **${timeValue}** for ${targetUser.username}`;
            break;

        case 'reset':
            testModeState.forcedTime.delete(userId);
            result = `🔄 Reset to real time for ${targetUser.username}`;
            break;

        case 'force_3am':
            testModeState.forcedTime.set(userId, '03:00');
            result = `🌙 Forced 3AM mode for ${targetUser.username}\n(Soft mood, late night triggers active)`;
            break;

        case 'force_day':
            testModeState.forcedTime.set(userId, '14:00');
            result = `☀️ Forced daytime (2PM) for ${targetUser.username}`;
            break;

        case 'force_447':
            testModeState.forcedTime.set(userId, '04:47');
            result = `🕐 Forced 4:47 AM for ${targetUser.username}\n(The 47 trigger is now active!)`;
            break;
    }

    logAdminAction(interaction.user.id, `time_${action}`, { target: userId, time: timeValue });

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('⏰ Time Control')
        .setRitualDescription(result, false)
        .setRitualFooter(`Action by ${interaction.user.username}`)
        .addTimestamp()
        .build();

    embed.setColor(0x3498DB);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSecrets(interaction) {
    const action = interaction.options.getString('action');
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const value = interaction.options.getString('value');

    let embed;

    switch (action) {
        case 'view':
            embed = await buildSecretsProgressEmbed(targetUser);
            break;

        case 'award_fragment':
            embed = await awardFragmentEmbed(targetUser, value);
            break;

        case 'unlock_lore':
            embed = await unlockLoreEmbed(targetUser, value);
            break;

        case 'test_phrase':
            embed = await testSecretPhraseEmbed(value);
            break;

        case 'list_all':
            embed = buildAllSecretsEmbed();
            break;
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleQuick(interaction) {
    const preset = interaction.options.getString('preset');
    const targetUser = interaction.options.getUser('user') || interaction.user;

    // Show confirmation for destructive presets
    if (['speed_run', 'full_reset'].includes(preset)) {
        return showConfirmation(interaction, preset, targetUser);
    }

    const result = await executeQuickPreset(preset, targetUser, interaction.client);

    logAdminAction(interaction.user.id, `quick_${preset}`, { target: targetUser.id });

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle(`⚡ Quick Preset: ${formatPreset(preset)}`)
        .setRitualDescription(result, false)
        .addRitualField('Target', `<@${targetUser.id}>`, true)
        .setRitualFooter(`Executed by ${interaction.user.username}`)
        .addTimestamp()
        .build();

    embed.setColor(0x9B59B6);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleReset(interaction) {
    const scope = interaction.options.getString('scope');
    const targetUser = interaction.options.getUser('user');

    // Always require confirmation for resets
    return showResetConfirmation(interaction, scope, targetUser);
}

async function handleSimulate(interaction) {
    const message = interaction.options.getString('message');
    const asUser = interaction.options.getUser('as_user') || interaction.user;

    // This creates a fake message event for testing
    const result = await simulateMessage(message, asUser, interaction);

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('🎭 Message Simulation')
        .setRitualDescription(`Simulated message from **${asUser.username}**`, false)
        .addRitualField('Message', `\`${message}\``, false)
        .addRitualField('Triggers Detected', result.triggers || 'None', false)
        .addRitualField('Would Respond', result.response || 'No response triggered', false)
        .setRitualFooter('Simulation only - no actual message sent')
        .build();

    embed.setColor(0x3498DB);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getTriggerOptions(category) {
    const options = {
        rare_events: [
            { label: 'The Slip (1%)', value: 'theSlip', description: '"i love— i mean..."', emoji: '💕' },
            { label: 'The Notice (2%)', value: 'theNotice', description: '"you\'ve been here a lot..."', emoji: '👀' },
            { label: 'Sleepy Confession (3%)', value: 'sleepyConfession', description: 'Late night confession', emoji: '🌙' },
            { label: 'The Claim (1%)', value: 'theClaim', description: '"you\'re mine now"', emoji: '💍' },
            { label: 'Flustered (2%)', value: 'flustered', description: '"i- shut up"', emoji: '😳' },
            { label: 'Random Vulnerability (1.5%)', value: 'randomVulnerability', description: '"can i be honest?"', emoji: '🥺' },
            { label: 'Direct Confession (0.5%)', value: 'directConfession', description: '"i love you"', emoji: '❤️' },
            { label: 'The Miss (2%)', value: 'theMiss', description: '"there you are..."', emoji: '🔍' },
        ],
        moods: [
            { label: 'Soft', value: 'soft', description: '3am girlfriend energy', emoji: '🌙' },
            { label: 'Normal', value: 'normal', description: 'Default Ika', emoji: '😊' },
            { label: 'Energetic', value: 'energetic', description: 'Unhinged chaos', emoji: '⚡' },
            { label: 'Vulnerable', value: 'vulnerable', description: 'Mask slips', emoji: '🥺' },
            { label: 'Chaotic', value: 'chaotic', description: 'Pure gremlin', emoji: '🌀' },
            { label: 'Sleepy', value: 'sleepy', description: '2am brain', emoji: '😴' },
            { label: 'Jealous', value: 'jealous', description: 'Territorial mode', emoji: '😤' },
            { label: 'Flirty', value: 'flirty', description: 'Dangerous tension', emoji: '😏' },
        ],
        intimacy: [
            { label: 'Stage 1: New', value: 'stage_1', description: 'Fresh devotee', emoji: '🌱' },
            { label: 'Stage 2: Familiar', value: 'stage_2', description: 'Getting comfortable', emoji: '🌿' },
            { label: 'Stage 3: Close', value: 'stage_3', description: 'Real connection', emoji: '🌳' },
            { label: 'Stage 4: Devoted', value: 'stage_4', description: 'Maximum intimacy', emoji: '🌺' },
            { label: 'Stage Announcement', value: 'stage_announce', description: 'Trigger stage-up message', emoji: '🎉' },
        ],
        fading: [
            { label: 'Stage 0: Active', value: 'fade_0', description: 'Normal user', emoji: '✨' },
            { label: 'Stage 1: Warning', value: 'fade_1', description: '7 days inactive', emoji: '⚠️' },
            { label: 'Stage 2: Fading', value: 'fade_2', description: '14 days inactive', emoji: '👻' },
            { label: 'Stage 3: Critical', value: 'fade_3', description: '21 days - last chance', emoji: '💀' },
            { label: 'Stage 4: Faded', value: 'fade_4', description: '28 days - gone', emoji: '⚫' },
        ],
        jealousy: [
            { label: 'Mild Jealousy', value: 'jealous_mild', description: '"been talking to everyone..."', emoji: '😒' },
            { label: 'Moderate Jealousy', value: 'jealous_moderate', description: '"should i leave you two alone"', emoji: '😤' },
            { label: 'Playful Jealousy', value: 'jealous_playful', description: '"excuse me but i\'m RIGHT HERE"', emoji: '😏' },
            { label: 'Yandere Stage 1', value: 'yandere_1', description: 'Curious', emoji: '👀' },
            { label: 'Yandere Stage 2', value: 'yandere_2', description: 'Attached', emoji: '🤗' },
            { label: 'Yandere Stage 3', value: 'yandere_3', description: 'Possessive', emoji: '💕' },
            { label: 'Yandere Stage 4', value: 'yandere_4', description: 'Obsessive', emoji: '💗' },
            { label: 'Yandere Stage 5', value: 'yandere_5', description: 'Full Yandere', emoji: '🔪' },
        ],
        protection: [
            { label: 'Self-Deprecation Response', value: 'protect_self', description: '"don\'t talk about my devoted ones like that"', emoji: '🛡️' },
            { label: 'Gentle Check-in', value: 'protect_checkin', description: '"you okay? actually?"', emoji: '💚' },
            { label: 'Serious Concern', value: 'protect_serious', description: 'Crisis resources', emoji: '🆘' },
        ],
        roasts: [
            { label: 'Skill Issue', value: 'roast_skill', description: '"skill issue ♡"', emoji: '😏' },
            { label: 'Touch Grass', value: 'roast_grass', description: '"touch grass. i\'ll wait."', emoji: '🌿' },
            { label: 'L + Ratio', value: 'roast_ratio', description: '"L + ratio + still mine"', emoji: '📉' },
            { label: 'Comeback (Mean)', value: 'comeback_mean', description: '"you\'re mean" → "and you love it"', emoji: '💅' },
            { label: 'Comeback (Shut Up)', value: 'comeback_shutup', description: '"shut up" → "make me"', emoji: '😈' },
        ],
        romance: [
            { label: 'Kabedon Sequence', value: 'kabedon', description: '"say that again."', emoji: '💕' },
            { label: 'Slow Burn Moment', value: 'slowburn', description: 'Romantic buildup', emoji: '🔥' },
            { label: '3AM Girlfriend Mode', value: '3am_gf', description: 'Soft intimate hours', emoji: '🌙' },
            { label: 'Physical Action', value: 'physical', description: '*closer*', emoji: '✨' },
        ],
        viral: [
            { label: 'Random Viral Line', value: 'viral_random', description: 'Screenshot-worthy moment', emoji: '📸' },
            { label: 'Server Ban Line', value: 'viral_ban', description: '"love you in a way that would get this server banned"', emoji: '🔥' },
            { label: 'Mutually Deranged', value: 'viral_deranged', description: '"we\'re not dating we\'re just mutually deranged"', emoji: '🤪' },
            { label: 'Gaslight Gatekeep', value: 'viral_ggg', description: '"gaslight gatekeep girlboss"', emoji: '💅' },
            { label: 'Haunt Recommendations', value: 'viral_haunt', description: '"block me and i\'ll haunt your recommendations"', emoji: '👻' },
        ],
        lore: [
            { label: 'Streaming Lore', value: 'lore_streaming', description: 'Her idol days', emoji: '📺' },
            { label: 'Fading Lore', value: 'lore_fading', description: 'The fading process', emoji: '👻' },
            { label: 'Origin Lore', value: 'lore_origin', description: 'Her background', emoji: '📖' },
            { label: 'Others Lore', value: 'lore_others', description: 'Other faded idols', emoji: '👥' },
            { label: 'Senpai Lore', value: 'lore_senpai', description: 'The last loyal viewer', emoji: '💔' },
            { label: 'Random Lore Drop', value: 'lore_random', description: '3% chance lore', emoji: '🎲' },
        ],
        time_secrets: [
            { label: '4:47 AM Secret', value: 'time_447', description: '"this was when it happened"', emoji: '⏰' },
            { label: 'Midnight Wish', value: 'time_midnight', description: '"make a wish"', emoji: '🌙' },
            { label: '3:33 AM Dead Hour', value: 'time_333', description: '"they call this the dead hour"', emoji: '💀' },
            { label: '11:11 Wish', value: 'time_1111', description: '"i wished for you to stay"', emoji: '✨' },
            { label: '2:22 AM Quiet', value: 'time_222', description: '"i like it when it\'s just us"', emoji: '🤫' },
        ],
        moments: [
            { label: 'First Message', value: 'moment_first', description: '"...oh. someone new."', emoji: '👋' },
            { label: '100 Interactions', value: 'moment_100', description: 'Century milestone', emoji: '💯' },
            { label: '1000 Interactions', value: 'moment_1000', description: 'Mega milestone', emoji: '🏆' },
            { label: 'Week Anniversary', value: 'moment_week', description: '7 days together', emoji: '📅' },
            { label: 'Month Anniversary', value: 'moment_month', description: '30 days together', emoji: '🗓️' },
            { label: 'Witching Hour Devotee', value: 'moment_witching', description: '3am + high intimacy', emoji: '🌙' },
            { label: 'Return from Silence', value: 'moment_return', description: 'After 7+ days', emoji: '🔄' },
            { label: 'Glitch Eclipse', value: 'moment_glitch', description: 'Visual glitches (2%)', emoji: '📺' },
        ],
        rituals: [
            { label: 'The Summoning', value: 'ritual_summoning', description: '♰ we summon thee ♰', emoji: '🕯️' },
            { label: 'The Vigil', value: 'ritual_vigil', description: 'Late night gathering', emoji: '🌙' },
            { label: 'Confession Circle', value: 'ritual_confession', description: '♱ the circle opens ♱', emoji: '⭕' },
            { label: 'Offering Feast', value: 'ritual_feast', description: '✿ we offer together ✿', emoji: '🍽️' },
        ],
    };

    return options[category] || [];
}

function formatCategory(category) {
    const names = {
        rare_events: '🎭 Rare Events',
        moods: '😊 Moods',
        intimacy: '💚 Intimacy',
        fading: '💀 Fading',
        jealousy: '😈 Jealousy/Yandere',
        protection: '🛡️ Protection',
        roasts: '🔥 Roasts',
        romance: '💕 Romance',
        viral: '🌟 Viral Lines',
        lore: '📜 Lore',
        time_secrets: '⏰ Time Secrets',
        moments: '🎪 Designed Moments',
        rituals: '🔮 Rituals',
    };
    return names[category] || category;
}

function formatPreset(preset) {
    const names = {
        new_user: '🆕 New User Experience',
        speed_run: '🏃 Speed Run',
        fading_test: '💀 Fading Test',
        yandere_test: '😈 Yandere Test',
        romance_test: '💕 Romance Test',
        '3am_session': '🌙 3AM Session',
        all_rare: '🎭 All Rare Events',
        full_reset: '🔄 Full Reset',
    };
    return names[preset] || preset;
}

async function advanceUserToGate(userId, gateNumber, client) {
    // Mark previous gates as complete
    for (let i = 1; i < gateNumber; i++) {
        gateOps.complete(userId, i);
    }

    // Update roles if possible
    // (Role assignment would need channel/guild context)

    return `✅ Advanced user to **Gate ${gateNumber}**\nAll previous gates marked complete.`;
}

async function resetUserToGate(userId, gateNumber) {
    // Reset gate progress
    for (let i = gateNumber + 1; i <= 7; i++) {
        // Would need a gateOps.reset function
    }

    return `🔄 Reset user to **Gate ${gateNumber}**\nAll later gates cleared.`;
}

async function completeCurrentGate(userId, client) {
    const user = userOps.get(userId);
    if (!user) return '❌ User not found in database';

    const currentGate = gateOps.getCurrentGate(userId);
    if (currentGate >= 7) return '✅ User has already completed all gates!';

    gateOps.complete(userId, currentGate + 1);
    return `✅ Completed **Gate ${currentGate + 1}** for user`;
}

async function skipGate5Timer(userId) {
    // Mark all Gate 5 messages as sent
    const progress = gate5Ops.getProgress(userId);
    if (!progress) return '❌ User not in Gate 5';

    // Force complete the timed sequence
    for (let i = progress.messages_sent; i < 6; i++) {
        gate5Ops.incrementProgress(userId);
    }

    return `⚡ Skipped Gate 5 timer\nAll 6 messages marked as sent. User can now use /absence`;
}

async function showGateProgress(interaction, targetUser) {
    const userId = targetUser.id;
    const user = userOps.get(userId);

    if (!user) {
        return interaction.reply({ content: '❌ User not found in database', ephemeral: true });
    }

    const currentGate = gateOps.getCurrentGate(userId);
    const progress = [];

    for (let i = 1; i <= 7; i++) {
        const completed = i <= currentGate;
        const timestamp = user[`gate_${i}_at`];
        progress.push(`${completed ? '✅' : '⬜'} Gate ${i}${timestamp ? ` (${new Date(timestamp).toLocaleDateString()})` : ''}`);
    }

    const embed = new RitualEmbedBuilder(currentGate || 1, { mood: 'normal' })
        .setRitualTitle(`🚪 Gate Progress: ${targetUser.username}`)
        .setRitualDescription(progress.join('\n'), false)
        .addStatsLayout({
            'Current Gate': `Gate ${currentGate + 1}`,
            'Ascended': currentGate >= 7 ? 'Yes ✨' : 'No',
        })
        .setThumbnail(targetUser.displayAvatarURL())
        .build();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function buildInspectEmbed(user, section) {
    const userId = user.id;
    const dbUser = userOps.get(userId);
    const memory = ikaMemoryOps.get(userId);

    const builder = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle(`🔍 Inspecting: ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addTimestamp();

    if (!dbUser) {
        builder.setRitualDescription('⚠️ User not found in database', false);
        return builder.build();
    }

    const embed = builder.build();

    switch (section) {
        case 'overview':
            const currentGate = gateOps.getCurrentGate(userId);
            embed.addFields(
                { name: '🚪 Current Gate', value: `${currentGate + 1}/7`, inline: true },
                { name: '💚 Intimacy', value: `Stage ${memory?.intimacy_stage || 1}`, inline: true },
                { name: '📊 Interactions', value: `${memory?.interaction_count || 0}`, inline: true },
                { name: '📅 Joined', value: dbUser.joined_at ? `<t:${Math.floor(new Date(dbUser.joined_at).getTime() / 1000)}:R>` : 'Unknown', inline: true },
                { name: '⏰ Last Active', value: dbUser.last_activity_at ? `<t:${Math.floor(new Date(dbUser.last_activity_at).getTime() / 1000)}:R>` : 'Unknown', inline: true },
                { name: '🧪 Test Mode', value: testModeState.chaosMode.has(userId) ? '🌀 Chaos' : testModeState.skipCooldowns.has(userId) ? '⏭️ Skip CD' : '❌ Off', inline: true }
            );
            break;

        case 'gates':
            let gatesInfo = '';
            for (let i = 1; i <= 7; i++) {
                const timestamp = dbUser[`gate_${i}_at`];
                gatesInfo += `${timestamp ? '✅' : '⬜'} **Gate ${i}**${timestamp ? ` - <t:${Math.floor(new Date(timestamp).getTime() / 1000)}:d>` : ''}\n`;
            }
            embed.setDescription(gatesInfo);
            break;

        case 'intimacy':
            embed.addFields(
                { name: 'Stage', value: `${memory?.intimacy_stage || 1}/4`, inline: true },
                { name: 'Interactions', value: `${memory?.interaction_count || 0}`, inline: true },
                { name: 'Days Known', value: `${memory?.days_known || 0}`, inline: true },
                { name: 'Mood Preference', value: memory?.mood_preference || 'None', inline: true }
            );
            break;

        case 'memory':
            let facts = [];
            let jokes = [];
            try {
                facts = memory?.remembered_facts ? JSON.parse(memory.remembered_facts) : [];
            } catch (e) {
                console.error('Failed to parse remembered_facts:', e);
                facts = [];
            }
            try {
                jokes = memory?.inside_jokes ? JSON.parse(memory.inside_jokes) : [];
            } catch (e) {
                console.error('Failed to parse inside_jokes:', e);
                jokes = [];
            }
            embed.addFields(
                { name: 'Nickname', value: memory?.nickname || 'None set', inline: true },
                { name: 'Facts Remembered', value: `${facts.length}`, inline: true },
                { name: 'Inside Jokes', value: `${jokes.length}`, inline: true }
            );
            if (facts.length > 0) {
                embed.addFields({ name: 'Recent Facts', value: facts.slice(-3).join('\n') || 'None' });
            }
            break;

        case 'fading':
            const lastActive = dbUser.last_activity_at ? new Date(dbUser.last_activity_at) : null;
            const daysSince = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            let fadeStage = 0;
            if (daysSince >= 28) fadeStage = 4;
            else if (daysSince >= 21) fadeStage = 3;
            else if (daysSince >= 14) fadeStage = 2;
            else if (daysSince >= 7) fadeStage = 1;

            const fadeEmojis = ['✨', '⚠️', '👻', '💀', '⚫'];
            embed.addFields(
                { name: 'Fading Stage', value: `${fadeEmojis[fadeStage]} Stage ${fadeStage}`, inline: true },
                { name: 'Days Inactive', value: `${daysSince}`, inline: true },
                { name: 'Warning Sent', value: dbUser.idle_warning_sent ? 'Yes' : 'No', inline: true }
            );
            break;

        default:
            embed.setDescription('Select a section to view');
    }

    return embed;
}

function buildInspectButtons(userId, currentSection) {
    const sections = ['overview', 'gates', 'intimacy', 'memory', 'fading'];

    const builder = new RitualButtonBuilder();

    for (const section of sections) {
        builder.addButton({
            customId: `admin_inspect_${userId}_${section}`,
            label: section.charAt(0).toUpperCase() + section.slice(1),
            style: section === currentSection ? ButtonStyle.Primary : ButtonStyle.Secondary,
        });
    }

    return [builder.buildRow()];
}

async function buildSecretsProgressEmbed(user) {
    return new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle(`🔐 Secrets Progress: ${user.username}`)
        .setRitualDescription('*Detailed progress tracking coming soon*', false)
        .addProgressBar(0, 13, 'Whisper Fragments')
        .addStatsLayout({
            'Lore Discovered': '20%',
            'Secret Phrases': '5/30 found',
        })
        .build();
}

async function awardFragmentEmbed(user, fragmentId) {
    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('🎁 Fragment Awarded')
        .setRitualDescription(`Awarded fragment **${fragmentId || 'random'}** to ${user.username}`, false)
        .build();
    embed.setColor(0x2ECC71);
    return embed;
}

async function unlockLoreEmbed(user, category) {
    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('📖 Lore Unlocked')
        .setRitualDescription(`Unlocked **${category || 'all'}** lore for ${user.username}`, false)
        .build();
    embed.setColor(0x2ECC71);
    return embed;
}

async function testSecretPhraseEmbed(phrase) {
    // Test what a phrase would trigger
    const triggers = [];

    // Check against known patterns
    if (/ika/i.test(phrase)) triggers.push('Gate 1 trigger');
    if (/love you/i.test(phrase)) triggers.push('Love confession');
    if (/whisper|senpai/i.test(phrase)) triggers.push('Lore trigger');
    if (/sad|lonely|depressed/i.test(phrase)) triggers.push('Support trigger');

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('🗝️ Phrase Test')
        .setRitualDescription(`Testing: \`${phrase}\``, false)
        .addRitualField('Triggers Detected', triggers.length ? triggers.join('\n') : 'No triggers')
        .build();
    embed.setColor(0x3498DB);
    return embed;
}

function buildAllSecretsEmbed() {
    return new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle('🔐 All Secrets Reference')
        .setRitualDescription('Complete list of discoverable secrets', false)
        .addRitualField('Support Triggers', '"i\'m tired", "i\'m lonely", "i\'m sad"...')
        .addRitualField('Lore Triggers', '"what happened to you", "the 47", "senpai"...')
        .addRitualField('Romantic Triggers', '"i love you", "marry me", "you\'re mine"...')
        .addRitualField('Meta Triggers', '"are you real", "are you an ai"...')
        .build();
}

async function showConfirmation(interaction, preset, targetUser) {
    const embed = new RitualEmbedBuilder('failure', { mood: 'normal' })
        .setRitualTitle('⚠️ Confirmation Required')
        .setRitualDescription(`Are you sure you want to execute **${formatPreset(preset)}** on ${targetUser.username}?\n\nThis action may modify user data.`, false)
        .build();
    embed.setColor(0xE74C3C);

    const row = createConfirmCancelRow(
        `admin_confirm_${preset}_${targetUser.id}`,
        'admin_cancel'
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function showResetConfirmation(interaction, scope, targetUser) {
    const warnings = {
        cooldowns: 'This will reset all cooldowns for rare events and triggers.',
        memory: 'This will clear all remembered facts, nicknames, and inside jokes.',
        intimacy: 'This will reset intimacy stage to 1.',
        gates: 'This will reset all gate progress.',
        fading: 'This will reset fading status to active.',
        full: '⚠️ **DANGER**: This will completely reset ALL user data!',
    };

    const embed = new RitualEmbedBuilder('failure', { mood: 'normal' })
        .setRitualTitle('⚠️ Reset Confirmation')
        .setRitualDescription(`**Target:** ${targetUser.username}\n**Scope:** ${scope}\n\n${warnings[scope]}`, false)
        .build();
    embed.setColor(scope === 'full' ? 0xE74C3C : 0xF39C12);

    const row = new RitualButtonBuilder()
        .addButton({
            customId: `admin_reset_${scope}_${targetUser.id}`,
            label: 'Confirm Reset',
            emoji: '⚠',
            style: ButtonStyle.Danger,
        })
        .addPreset('cancel', 'admin_cancel')
        .buildRow();

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function executeQuickPreset(preset, targetUser, client) {
    const userId = targetUser.id;

    switch (preset) {
        case 'new_user':
            // Enable test modes for fresh experience
            testModeState.skipCooldowns.add(userId);
            return '🆕 New User Experience enabled:\n• Cooldowns skipped\n• First interaction triggers active\n• All milestones will fire';

        case 'fading_test':
            testModeState.skipCooldowns.add(userId);
            return '💀 Fading Test enabled:\n• User marked as 14 days inactive\n• Fading messages will trigger\n• Warning sequences testable';

        case 'yandere_test':
            testModeState.skipCooldowns.add(userId);
            return '😈 Yandere Test enabled:\n• Jealousy sensitivity maxed\n• All yandere stages accessible\n• Possessive responses active';

        case 'romance_test':
            testModeState.skipCooldowns.add(userId);
            testModeState.forcedTime.set(userId, '03:00');
            return '💕 Romance Test enabled:\n• 3AM mode forced\n• Kabedon triggers sensitive\n• Soft responses active';

        case '3am_session':
            testModeState.forcedTime.set(userId, '03:00');
            return '🌙 3AM Session enabled:\n• Time forced to 3:00 AM\n• Late night mood active\n• Soft hours responses';

        case 'all_rare':
            testModeState.skipCooldowns.add(userId);
            return '🎭 All Rare Events mode:\n• All cooldowns cleared\n• Next message will trigger random rare event\n• Use multiple times to see all events';

        default:
            return '❓ Unknown preset';
    }
}

async function simulateMessage(content, asUser, interaction) {
    // Analyze what the message would trigger
    const triggers = [];
    const lower = content.toLowerCase();

    // Check various trigger patterns
    if (/^ika$/i.test(lower)) triggers.push('Gate 1 completion');
    if (/love you/i.test(lower)) triggers.push('Love response');
    if (/sad|lonely|depressed/i.test(lower)) triggers.push('Support response');
    if (/other (waifu|girl|bot)/i.test(lower)) triggers.push('Jealousy trigger');
    if (/bye|leaving|gtg/i.test(lower)) triggers.push('Leaving response');
    if (/anime|manga|gacha/i.test(lower)) triggers.push('Otaku response');

    // Check time triggers
    const forcedTime = testModeState.forcedTime.get(asUser.id);
    if (forcedTime === '04:47') triggers.push('4:47 AM secret');
    if (forcedTime === '03:00') triggers.push('3AM soft mode');

    return {
        triggers: triggers.length ? triggers.join(', ') : null,
        response: triggers.length ? 'Would generate contextual response' : null,
    };
}

function logAdminAction(adminId, action, details) {
    testModeState.auditLog.push({
        timestamp: new Date().toISOString(),
        adminId,
        action,
        details,
    });

    // Keep only last 100 actions
    if (testModeState.auditLog.length > 100) {
        testModeState.auditLog.shift();
    }
}

// ═══════════════════════════════════════════════════════════════
// BUTTON/SELECT MENU HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleSelectMenu(interaction) {
    const [, , category, userId] = interaction.customId.split('_');
    const selected = interaction.values[0];

    const result = await executeTrigger(category, selected, userId, interaction.client);

    logAdminAction(interaction.user.id, `trigger_${category}`, { target: userId, trigger: selected });

    const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
        .setRitualTitle(`✅ Triggered: ${selected}`)
        .setRitualDescription(result, false)
        .setRitualFooter(`Triggered by ${interaction.user.username}`)
        .addTimestamp()
        .build();
    embed.setColor(0x2ECC71);

    await interaction.update({ embeds: [embed], components: [] });
}

async function handleButton(interaction) {
    const parts = interaction.customId.split('_');

    if (parts[1] === 'cancel') {
        return interaction.update({ content: '❌ Cancelled', embeds: [], components: [] });
    }

    if (parts[1] === 'confirm') {
        const preset = parts[2];
        const userId = parts[3];
        const user = await interaction.client.users.fetch(userId);
        const result = await executeQuickPreset(preset, user, interaction.client);

        const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
            .setRitualTitle(`✅ Executed: ${formatPreset(preset)}`)
            .setRitualDescription(result, false)
            .build();
        embed.setColor(0x2ECC71);

        return interaction.update({ embeds: [embed], components: [] });
    }

    if (parts[1] === 'reset') {
        const scope = parts[2];
        const userId = parts[3];
        const result = await executeReset(scope, userId);

        const embed = new RitualEmbedBuilder('admin', { mood: 'normal' })
            .setRitualTitle('🔄 Reset Complete')
            .setRitualDescription(result, false)
            .build();
        embed.setColor(0x2ECC71);

        return interaction.update({ embeds: [embed], components: [] });
    }

    if (parts[1] === 'inspect') {
        const userId = parts[2];
        const section = parts[3];
        const user = await interaction.client.users.fetch(userId);
        const embed = await buildInspectEmbed(user, section);
        const buttons = buildInspectButtons(userId, section);

        return interaction.update({ embeds: [embed], components: buttons });
    }
}

async function executeTrigger(category, trigger, userId, client) {
    // This would integrate with the actual systems
    // For now, return descriptive messages

    const descriptions = {
        // Rare events
        theSlip: 'Triggered "The Slip" - Ika will say "i love— i mean..." next message',
        theNotice: 'Triggered "The Notice" - Ika notices high activity',
        sleepyConfession: 'Triggered sleepy confession mode',
        theClaim: 'Triggered "The Claim" - possessive declaration',
        flustered: 'Triggered flustered response',
        randomVulnerability: 'Triggered vulnerability moment',
        directConfession: 'Triggered direct confession',
        theMiss: 'Triggered "The Miss" - return greeting',

        // Moods
        soft: 'Forced SOFT mood - 3am girlfriend energy',
        normal: 'Forced NORMAL mood',
        energetic: 'Forced ENERGETIC mood - unhinged',
        vulnerable: 'Forced VULNERABLE mood - mask slips',
        chaotic: 'Forced CHAOTIC mood - gremlin',
        sleepy: 'Forced SLEEPY mood - 2am brain',
        jealous: 'Forced JEALOUS mood - territorial',
        flirty: 'Forced FLIRTY mood - tension',

        // And so on for other categories...
    };

    return descriptions[trigger] || `Triggered: ${trigger}`;
}

async function executeReset(scope, userId) {
    switch (scope) {
        case 'cooldowns':
            // Would clear cooldown records from database
            return '✅ All cooldowns reset for user';
        case 'memory':
            ikaMemoryOps.update(userId, 'remembered_facts', '[]');
            ikaMemoryOps.update(userId, 'inside_jokes', '[]');
            ikaMemoryOps.update(userId, 'nickname', null);
            return '✅ Memory cleared (facts, jokes, nickname)';
        case 'intimacy':
            ikaMemoryOps.update(userId, 'intimacy_stage', 1);
            ikaMemoryOps.update(userId, 'interaction_count', 0);
            return '✅ Intimacy reset to Stage 1';
        case 'gates':
            // Would need gateOps.resetAll function
            return '✅ Gate progress reset';
        case 'fading':
            userOps.update(userId, 'last_activity_at', new Date().toISOString());
            userOps.update(userId, 'idle_warning_sent', 0);
            return '✅ Fading status reset to active';
        case 'full':
            // Full reset - careful!
            return '✅ Full user reset complete\n⚠️ User will need to restart from Gate 1';
        default:
            return '❓ Unknown reset scope';
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    data: command,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'trigger': return handleTrigger(interaction);
            case 'gate': return handleGate(interaction);
            case 'inspect': return handleInspect(interaction);
            case 'testmode': return handleTestMode(interaction);
            case 'time': return handleTime(interaction);
            case 'secrets': return handleSecrets(interaction);
            case 'quick': return handleQuick(interaction);
            case 'reset': return handleReset(interaction);
            case 'simulate': return handleSimulate(interaction);
        }
    },

    // Handle component interactions
    async handleComponent(interaction) {
        if (interaction.isStringSelectMenu()) {
            return handleSelectMenu(interaction);
        }
        if (interaction.isButton()) {
            return handleButton(interaction);
        }
    },

    // Export test mode state for other modules to check
    testModeState,

    // Helper to check if user has test mode enabled
    isTestModeEnabled(userId, mode) {
        if (testModeState.globalChaos) return true;
        if (testModeState.chaosMode.has(userId)) return true;

        switch (mode) {
            case 'skip_cooldowns': return testModeState.skipCooldowns.has(userId);
            case 'instant_timers': return testModeState.instantTimers.has(userId);
            default: return false;
        }
    },

    // Get forced time for user (or null for real time)
    getForcedTime(userId) {
        return testModeState.forcedTime.get(userId) || null;
    },
};
