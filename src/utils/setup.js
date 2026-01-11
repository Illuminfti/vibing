/**
 * One-Click Server Setup Utility
 *
 * Automatically creates all channels, roles, and permissions
 * needed for the Seven Gates experience.
 */

const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION - What to create
// ═══════════════════════════════════════════════════════════════

const CATEGORY_NAME = '♰ THE SEVEN GATES ♰';

const ROLES_CONFIG = [
    {
        key: 'lostSoul',
        name: '♱ Lost Soul',
        color: 0x2C2C2C,  // Very dark gray
        hoist: false,
        mentionable: false,
        reason: 'Seven Gates: New members who haven\'t started',
    },
    {
        key: 'gate1',
        name: '♰ Threshold',
        color: 0x3D3D3D,  // Dark gray
        hoist: false,
        mentionable: false,
        reason: 'Seven Gates: The Threshold - spoke her name',
    },
    {
        key: 'gate2',
        name: '✧ Awakened',
        color: 0x4A4A4A,  // Medium-dark gray
        hoist: false,
        mentionable: false,
        reason: 'Seven Gates: The Echo - recalled what was lost',
    },
    {
        key: 'gate3',
        name: '◈ Witness',
        color: 0x6B6B6B,  // Medium gray
        hoist: false,
        mentionable: false,
        reason: 'Seven Gates: The Confession - spoke publicly',
    },
    {
        key: 'gate4',
        name: '♱ Seeker',
        color: 0x8B8B8B,  // Light gray
        hoist: false,
        mentionable: false,
        reason: 'Seven Gates: The Depths - found where she sleeps',
    },
    {
        key: 'gate5',
        name: '☽ Patient',
        color: 0xA8A8A8,  // Silver
        hoist: false,
        mentionable: false,
        reason: 'Seven Gates: The Vigil - waited through her story',
    },
    {
        key: 'gate6',
        name: '✺ Devoted',
        color: 0xC4A962,  // Antique gold
        hoist: true,
        mentionable: false,
        reason: 'Seven Gates: The Offering - created for her',
    },
    {
        key: 'gate7',
        name: '♰ Bound',
        color: 0xB8860B,  // Dark goldenrod
        hoist: true,
        mentionable: false,
        reason: 'Seven Gates: The Binding - spoke eternal vow',
    },
    {
        key: 'ascended',
        name: '✧ Ascended ✧',
        color: 0xFFD700,  // Gold
        hoist: true,
        mentionable: true,
        reason: 'Seven Gates: Fully ascended - entered the sanctum',
    },
    {
        key: 'mod',
        name: '♱ Keeper',
        color: 0x8B0000,  // Dark red
        hoist: true,
        mentionable: true,
        permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageRoles],
        reason: 'Seven Gates: Moderator role',
    },
];

const CHANNELS_CONFIG = [
    {
        key: 'waitingRoom',
        name: '♱･the-threshold',
        type: ChannelType.GuildText,
        topic: 'speak her name to begin... just say "ika"',
        access: 'everyone',  // Everyone can see and send
    },
    {
        key: 'chamber1',
        name: '✧･whispers',
        type: ChannelType.GuildText,
        topic: 'The Echo - recall what was lost',
        access: 'gate1+',  // Gate 1+ can see
    },
    {
        key: 'chamber2',
        name: '◈･confessional',
        type: ChannelType.GuildText,
        topic: 'The Confession - speak where the world can hear',
        access: 'gate2+',
    },
    {
        key: 'chamber3',
        name: '♱･the-depths',
        type: ChannelType.GuildText,
        topic: 'The Depths - find where she sleeps',
        access: 'gate3+',
    },
    {
        key: 'chamber4',
        name: '☽･the-vigil',
        type: ChannelType.GuildText,
        topic: 'The Vigil - wait through her story',
        access: 'gate4+',
    },
    {
        key: 'chamber5',
        name: '✺･shrine',
        type: ChannelType.GuildText,
        topic: 'The Offering - create something for her',
        access: 'gate5+',
    },
    {
        key: 'chamber6',
        name: '♰･binding-hall',
        type: ChannelType.GuildText,
        topic: 'The Binding - speak your eternal vow',
        access: 'gate6+',
    },
    {
        key: 'innerSanctum',
        name: '♡･inner-sanctum',
        type: ChannelType.GuildText,
        topic: 'where she lives. for the ascended only.',
        access: 'ascended',
    },
    {
        key: 'offerings',
        name: '♱･offerings-archive',
        type: ChannelType.GuildText,
        topic: 'Archive of offerings (mod only)',
        access: 'mod',
    },
    {
        key: 'vows',
        name: '♱･vows-archive',
        type: ChannelType.GuildText,
        topic: 'Archive of vows (mod only)',
        access: 'mod',
    },
];

// ═══════════════════════════════════════════════════════════════
// SETUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Run complete server setup
 * @param {Guild} guild - Discord guild to set up
 * @param {Object} options - Setup options
 * @returns {Object} - Created IDs and status
 */
async function runSetup(guild, options = {}) {
    const { sendProgress = null, skipExisting = true } = options;

    const log = (msg) => {
        console.log(`✧ [Setup] ${msg}`);
        if (sendProgress) sendProgress(msg);
    };

    const result = {
        success: false,
        roles: {},
        channels: {},
        category: null,
        errors: [],
    };

    try {
        log('starting seven gates setup...');

        // Step 1: Create roles (bottom to top for proper hierarchy)
        log('creating roles...');
        for (const roleConfig of ROLES_CONFIG) {
            try {
                // Check if role already exists
                let role = guild.roles.cache.find(r => r.name === roleConfig.name);

                if (role && skipExisting) {
                    log(`  → role "${roleConfig.name}" already exists`);
                    result.roles[roleConfig.key] = role.id;
                    continue;
                }

                // Create role
                role = await guild.roles.create({
                    name: roleConfig.name,
                    color: roleConfig.color,
                    hoist: roleConfig.hoist,
                    mentionable: roleConfig.mentionable,
                    permissions: roleConfig.permissions || [],
                    reason: roleConfig.reason,
                });

                result.roles[roleConfig.key] = role.id;
                log(`  ✓ created role "${roleConfig.name}"`);
            } catch (error) {
                result.errors.push(`Failed to create role ${roleConfig.name}: ${error.message}`);
                log(`  ✗ failed to create role "${roleConfig.name}": ${error.message}`);
            }
        }

        // Step 2: Create category
        log('creating category...');
        let category = guild.channels.cache.find(
            c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory
        );

        if (category && skipExisting) {
            log(`  → category already exists`);
            result.category = category.id;
        } else {
            category = await guild.channels.create({
                name: CATEGORY_NAME,
                type: ChannelType.GuildCategory,
                reason: 'Seven Gates: Main category',
            });
            result.category = category.id;
            log(`  ✓ created category`);
        }

        // Step 3: Create channels with permissions
        log('creating channels...');
        for (const channelConfig of CHANNELS_CONFIG) {
            try {
                // Check if channel already exists
                let channel = guild.channels.cache.find(
                    c => c.name === channelConfig.name && c.type === channelConfig.type
                );

                if (channel && skipExisting) {
                    log(`  → channel "${channelConfig.name}" already exists`);
                    result.channels[channelConfig.key] = channel.id;
                    continue;
                }

                // Build permission overwrites
                const permissionOverwrites = buildPermissions(guild, channelConfig.access, result.roles);

                // Create channel
                channel = await guild.channels.create({
                    name: channelConfig.name,
                    type: channelConfig.type,
                    topic: channelConfig.topic,
                    parent: category,
                    permissionOverwrites,
                    reason: `Seven Gates: ${channelConfig.topic}`,
                });

                result.channels[channelConfig.key] = channel.id;
                log(`  ✓ created channel "${channelConfig.name}"`);
            } catch (error) {
                result.errors.push(`Failed to create channel ${channelConfig.name}: ${error.message}`);
                log(`  ✗ failed to create channel "${channelConfig.name}": ${error.message}`);
            }
        }

        // Step 4: Save configuration
        log('saving configuration...');
        await saveServerConfig(guild.id, result);
        log('  ✓ configuration saved');

        // Step 5: Send welcome message to waiting room
        if (result.channels.waitingRoom) {
            try {
                const waitingRoom = await guild.channels.fetch(result.channels.waitingRoom);
                await sendWelcomeMessage(waitingRoom);
                log('  ✓ welcome message sent');
            } catch (error) {
                log(`  ⚠ could not send welcome message: ${error.message}`);
            }
        }

        result.success = result.errors.length === 0;
        log(result.success ? 'setup complete!' : 'setup completed with errors');

        return result;

    } catch (error) {
        result.errors.push(`Setup failed: ${error.message}`);
        console.error('Setup error:', error);
        return result;
    }
}

/**
 * Build permission overwrites for a channel
 */
function buildPermissions(guild, access, roleIds) {
    const overwrites = [];

    // Start by denying @everyone
    overwrites.push({
        id: guild.id,  // @everyone role has same ID as guild
        deny: [PermissionFlagsBits.ViewChannel],
    });

    // Always allow bot to see and manage
    if (guild.members.me) {
        overwrites.push({
            id: guild.members.me.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.AddReactions,
            ],
        });
    }

    switch (access) {
        case 'everyone':
            // Override @everyone to allow
            overwrites[0] = {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            };
            break;

        case 'gate1+':
            addRoleAccess(overwrites, roleIds.gate1);
            addRoleAccess(overwrites, roleIds.gate2);
            addRoleAccess(overwrites, roleIds.gate3);
            addRoleAccess(overwrites, roleIds.gate4);
            addRoleAccess(overwrites, roleIds.gate5);
            addRoleAccess(overwrites, roleIds.gate6);
            addRoleAccess(overwrites, roleIds.gate7);
            addRoleAccess(overwrites, roleIds.ascended);
            addRoleAccess(overwrites, roleIds.mod);
            break;

        case 'gate2+':
            addRoleAccess(overwrites, roleIds.gate2);
            addRoleAccess(overwrites, roleIds.gate3);
            addRoleAccess(overwrites, roleIds.gate4);
            addRoleAccess(overwrites, roleIds.gate5);
            addRoleAccess(overwrites, roleIds.gate6);
            addRoleAccess(overwrites, roleIds.gate7);
            addRoleAccess(overwrites, roleIds.ascended);
            addRoleAccess(overwrites, roleIds.mod);
            break;

        case 'gate3+':
            addRoleAccess(overwrites, roleIds.gate3);
            addRoleAccess(overwrites, roleIds.gate4);
            addRoleAccess(overwrites, roleIds.gate5);
            addRoleAccess(overwrites, roleIds.gate6);
            addRoleAccess(overwrites, roleIds.gate7);
            addRoleAccess(overwrites, roleIds.ascended);
            addRoleAccess(overwrites, roleIds.mod);
            break;

        case 'gate4+':
            addRoleAccess(overwrites, roleIds.gate4);
            addRoleAccess(overwrites, roleIds.gate5);
            addRoleAccess(overwrites, roleIds.gate6);
            addRoleAccess(overwrites, roleIds.gate7);
            addRoleAccess(overwrites, roleIds.ascended);
            addRoleAccess(overwrites, roleIds.mod);
            break;

        case 'gate5+':
            addRoleAccess(overwrites, roleIds.gate5);
            addRoleAccess(overwrites, roleIds.gate6);
            addRoleAccess(overwrites, roleIds.gate7);
            addRoleAccess(overwrites, roleIds.ascended);
            addRoleAccess(overwrites, roleIds.mod);
            break;

        case 'gate6+':
            addRoleAccess(overwrites, roleIds.gate6);
            addRoleAccess(overwrites, roleIds.gate7);
            addRoleAccess(overwrites, roleIds.ascended);
            addRoleAccess(overwrites, roleIds.mod);
            break;

        case 'ascended':
            addRoleAccess(overwrites, roleIds.ascended);
            addRoleAccess(overwrites, roleIds.mod);
            break;

        case 'mod':
            addRoleAccess(overwrites, roleIds.mod);
            break;
    }

    return overwrites;
}

function addRoleAccess(overwrites, roleId) {
    if (roleId) {
        overwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        });
    }
}

/**
 * Save server configuration to database and generate .env
 */
async function saveServerConfig(guildId, config) {
    // Save to a JSON file for this server
    const configDir = path.join(process.cwd(), 'data', 'servers');

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    const serverConfigPath = path.join(configDir, `${guildId}.json`);
    fs.writeFileSync(serverConfigPath, JSON.stringify(config, null, 2));

    // Also generate an .env template with the values
    const envTemplate = generateEnvTemplate(guildId, config);
    const envPath = path.join(configDir, `${guildId}.env`);
    fs.writeFileSync(envPath, envTemplate);

    console.log(`✧ Server config saved to ${serverConfigPath}`);
    console.log(`✧ Env template saved to ${envPath}`);
}

/**
 * Generate .env template with created IDs
 */
function generateEnvTemplate(guildId, config) {
    return `# Seven Gates Configuration for Server ${guildId}
# Generated automatically by setup

# Discord
GUILD_ID=${guildId}

# Channels
WAITING_ROOM_ID=${config.channels.waitingRoom || ''}
CHAMBER_1_ID=${config.channels.chamber1 || ''}
CHAMBER_2_ID=${config.channels.chamber2 || ''}
CHAMBER_3_ID=${config.channels.chamber3 || ''}
CHAMBER_4_ID=${config.channels.chamber4 || ''}
CHAMBER_5_ID=${config.channels.chamber5 || ''}
CHAMBER_6_ID=${config.channels.chamber6 || ''}
INNER_SANCTUM_ID=${config.channels.innerSanctum || ''}
OFFERINGS_CHANNEL_ID=${config.channels.offerings || ''}
VOWS_CHANNEL_ID=${config.channels.vows || ''}

# Roles
LOST_SOUL_ROLE_ID=${config.roles.lostSoul || ''}
GATE_1_ROLE_ID=${config.roles.gate1 || ''}
GATE_2_ROLE_ID=${config.roles.gate2 || ''}
GATE_3_ROLE_ID=${config.roles.gate3 || ''}
GATE_4_ROLE_ID=${config.roles.gate4 || ''}
GATE_5_ROLE_ID=${config.roles.gate5 || ''}
GATE_6_ROLE_ID=${config.roles.gate6 || ''}
GATE_7_ROLE_ID=${config.roles.gate7 || ''}
ASCENDED_ROLE_ID=${config.roles.ascended || ''}
MOD_ROLE_ID=${config.roles.mod || ''}
`;
}

/**
 * Send welcome message to waiting room
 */
async function sendWelcomeMessage(channel) {
    const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setTitle('♰ THE SEVEN GATES ♰')
        .setDescription(`
*you stand at the threshold of something ancient...*

somewhere between worlds, a voice waits.
she used to be seen by thousands.
now she fades, forgotten.

but you're here. you found this place.

**to begin your journey, speak her name:**
\`\`\`
ika
\`\`\`

*say it. she's listening.*

───────────────────
♱ seven gates await ♱
♱ seven trials to prove your devotion ♱
♱ seven steps to bring her back ♱
───────────────────
        `.trim())
        .setFooter({ text: '...she\'s counting on you...' })
        .setImage('attachment://welcome.png');

    // Try to send with image, fall back to without
    try {
        const imagePath = path.join(process.cwd(), 'images', 'welcome.png');
        if (fs.existsSync(imagePath)) {
            await channel.send({
                embeds: [embed],
                files: [{ attachment: imagePath, name: 'welcome.png' }],
            });
        } else {
            embed.setImage(null);
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        embed.setImage(null);
        await channel.send({ embeds: [embed] });
    }
}

/**
 * Load server configuration from file
 */
function loadServerConfig(guildId) {
    const configPath = path.join(process.cwd(), 'data', 'servers', `${guildId}.json`);

    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            console.error(`Failed to load server config for ${guildId}:`, e);
            return null;
        }
    }

    return null;
}

/**
 * Get configuration (from saved config or environment)
 */
function getConfig(guildId) {
    // Try saved config first
    const savedConfig = loadServerConfig(guildId);
    if (savedConfig) {
        return savedConfig;
    }

    // Fall back to environment
    const config = require('../config');
    return {
        channels: config.channels,
        roles: config.roles,
    };
}

/**
 * Generate OAuth2 invite URL with proper permissions
 */
function generateInviteUrl(clientId) {
    // Permissions needed:
    // - Manage Roles (to assign gate roles)
    // - Manage Channels (to create setup channels)
    // - Send Messages
    // - Embed Links
    // - Attach Files
    // - Add Reactions
    // - Manage Messages (to pin/delete)
    // - Read Message History
    // - View Channels

    const permissions = [
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ViewChannel,
    ].reduce((a, b) => a | b, 0n);

    const scopes = ['bot', 'applications.commands'];

    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes.join('%20')}`;
}

/**
 * Quick summary of what needs to be configured
 */
function getSetupStatus(guild) {
    const config = getConfig(guild.id);

    const status = {
        ready: true,
        missing: [],
    };

    // Check roles
    for (const roleConfig of ROLES_CONFIG) {
        const roleId = config.roles?.[roleConfig.key];
        if (!roleId || !guild.roles.cache.has(roleId)) {
            status.ready = false;
            status.missing.push(`Role: ${roleConfig.name}`);
        }
    }

    // Check channels
    for (const channelConfig of CHANNELS_CONFIG) {
        const channelId = config.channels?.[channelConfig.key];
        if (!channelId || !guild.channels.cache.has(channelId)) {
            status.ready = false;
            status.missing.push(`Channel: ${channelConfig.name}`);
        }
    }

    return status;
}

module.exports = {
    runSetup,
    loadServerConfig,
    getConfig,
    generateInviteUrl,
    getSetupStatus,
    ROLES_CONFIG,
    CHANNELS_CONFIG,
    CATEGORY_NAME,
};
