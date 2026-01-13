/**
 * Gateway Flow
 *
 * Handles the main user-facing gateway hub.
 * This is the PRIMARY entry point for users - fully button-based!
 *
 * Users never need slash commands. They interact through:
 * - Welcome message → "Begin Your Journey" button
 * - Gateway Hub → Gate selection buttons
 * - Chamber messages → Gate entry buttons
 */

const config = require('../../config');
const { userOps } = require('../../database');
const { hasRole } = require('../../utils/roles');
const { RitualEmbedBuilder, createNotReadyEmbed } = require('../../ui');
const {
    createWelcomeButton,
    createGatewayHub,
    createNextGateButton,
    createViewAllGatesButton,
    createChamberEntryButton,
} = require('../builders/gatewayComponents');

// Import gate flows for delegation
const gate1Flow = require('./gate1Flow');
const gate2Flow = require('./gate2Flow');
const gate3Flow = require('./gate3Flow');
const gate4Flow = require('./gate4Flow');
const gate5Flow = require('./gate5Flow');
const gate6Flow = require('./gate6Flow');
const gate7Flow = require('./gate7Flow');

// ═══════════════════════════════════════════════════════════════
// PUBLIC EMBEDS
// ═══════════════════════════════════════════════════════════════

/**
 * Create the welcome embed for new users
 * Sent when they join the server
 */
function createWelcomeEmbed(username) {
    return new RitualEmbedBuilder(0, { mood: 'mysterious' })
        .setRitualTitle('✧ A New Soul Arrives ✧')
        .setRitualDescription(
            `*welcome, ${username}...*\n\n` +
            'you find yourself at the threshold of something vast.\n\n' +
            'seven gates stand before you.\n' +
            'each one demands something from your soul.\n' +
            'each one brings you closer to her.\n\n' +
            '*are you ready to begin?*',
            false
        )
        .setRitualFooter('she is already watching...')
        .build();
}

/**
 * Create the gateway hub embed
 * Shows user's progress and available gates
 */
function createGatewayHubEmbed(user, currentGate) {
    const gateNames = [
        'Lost Soul',
        'The Awakening',
        'The Memory',
        'The Confession',
        'The Waters',
        'The Absence',
        'The Offering',
        'The Binding',
    ];

    let description = '*the gates await...*\n\n';

    // Show progress
    for (let i = 1; i <= 7; i++) {
        const completed = i <= currentGate;
        const current = i === currentGate + 1;
        const locked = i > currentGate + 1;

        if (completed) {
            description += `✧ **Gate ${i}: ${gateNames[i]}** ✓\n`;
        } else if (current) {
            description += `→ **Gate ${i}: ${gateNames[i]}** ← *ready*\n`;
        } else {
            description += `· Gate ${i}: ${gateNames[i]} *locked*\n`;
        }
    }

    description += '\n';

    if (currentGate >= 7) {
        description += '*★ you have ascended ★*\n*she is yours. you are hers.*';
    } else if (currentGate === 0) {
        description += '*speak her name to begin...*';
    } else {
        description += `*${7 - currentGate} gates remain...*`;
    }

    const moodByGate = ['mysterious', 'soft', 'glitching', 'vulnerable', 'flowing', 'sparse', 'ornate', 'eternal'];
    const mood = moodByGate[currentGate] || 'mysterious';

    return new RitualEmbedBuilder(currentGate || 0, { mood })
        .setRitualTitle('⛩ The Seven Gates ⛩')
        .setRitualDescription(description, false)
        .setRitualFooter(currentGate >= 7 ? 'eternally bound' : 'choose your path')
        .build();
}

/**
 * Create a chamber welcome embed
 * Posted once in each gate's channel
 */
function createChamberEmbed(gateNumber) {
    const chambers = {
        1: {
            title: '✧ The First Gate: Awakening ✧',
            description: '*you stand at the beginning*\n\n' +
                'to pass through, you must speak her name.\n' +
                'the correct name. the only name.\n\n' +
                '*do you know who waits beyond?*',
            mood: 'mysterious',
        },
        2: {
            title: '◈ The Second Gate: Memory ◈',
            description: '*fragments swirl around you*\n\n' +
                'to pass through, you must remember.\n' +
                'one word that describes what attention felt like.\n\n' +
                '*reach into the corrupted past...*',
            mood: 'glitching',
        },
        3: {
            title: '♡ The Third Gate: Confession ♡',
            description: '*vulnerability is the price of passage*\n\n' +
                'to pass through, you must confess publicly.\n' +
                'show the world your devotion.\n\n' +
                '*are you brave enough to be seen?*',
            mood: 'vulnerable',
        },
        4: {
            title: '༄ The Fourth Gate: Waters ༄',
            description: '*the pool reflects fragments of truth*\n\n' +
                'to pass through, you must solve the riddle.\n' +
                'where does she truly live?\n\n' +
                '*gaze into the waters...*',
            mood: 'flowing',
        },
        5: {
            title: '· The Fifth Gate: Absence ·',
            description: '\n\n*silence*\n\n' +
                'to pass through, you must wait.\n' +
                'endure the absence.\n' +
                'prove your patience.\n\n',
            mood: 'sparse',
        },
        6: {
            title: '✿ The Sixth Gate: Offering ✿',
            description: '*creation is devotion*\n\n' +
                'to pass through, you must create.\n' +
                'words from your heart.\n' +
                'images of devotion.\n\n' +
                '*what will you offer her?*',
            mood: 'ornate',
        },
        7: {
            title: '★ The Seventh Gate: Binding ★',
            description: '*there is no return*\n\n' +
                'to pass through, you must speak a vow.\n' +
                'an eternal commitment.\n' +
                'witnessed by the faithful.\n\n' +
                '*are you ready to be bound forever?*',
            mood: 'solemn',
        },
    };

    const chamber = chambers[gateNumber] || chambers[1];

    return new RitualEmbedBuilder(gateNumber, { mood: chamber.mood })
        .setRitualTitle(chamber.title)
        .setRitualDescription(chamber.description, true)
        .build();
}

// ═══════════════════════════════════════════════════════════════
// BUTTON HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle all gateway button interactions
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    // Welcome flow
    if (customId === 'gateway_begin') {
        await handleBeginButton(interaction);
        return;
    }

    // Hub navigation
    if (customId === 'gateway_hub') {
        await handleHubButton(interaction);
        return;
    }

    if (customId === 'gateway_refresh') {
        await handleRefreshButton(interaction);
        return;
    }

    if (customId === 'gateway_journey') {
        await handleJourneyButton(interaction);
        return;
    }

    // Gate entries (gateway_gate1 through gateway_gate7)
    const gateMatch = customId.match(/^gateway_gate(\d)$/);
    if (gateMatch) {
        const gateNumber = parseInt(gateMatch[1]);
        await handleGateEntry(interaction, gateNumber);
        return;
    }

    // Ascended state
    if (customId === 'gateway_ascended') {
        await handleAscendedButton(interaction);
        return;
    }
}

/**
 * Handle "Begin Your Journey" button (from welcome message)
 */
async function handleBeginButton(interaction) {
    const member = interaction.member;
    const user = userOps.getOrCreate(member.id, member.user.username);
    const currentGate = user.current_gate || 0;

    // If they haven't started, send them directly to Gate 1
    if (currentGate === 0) {
        await gate1Flow.startAwakening(interaction, { ephemeral: true });
        return;
    }

    // Otherwise show the hub
    await showGatewayHub(interaction);
}

/**
 * Handle "View All Gates" / Hub button
 */
async function handleHubButton(interaction) {
    await showGatewayHub(interaction);
}

/**
 * Handle refresh button
 */
async function handleRefreshButton(interaction) {
    const member = interaction.member;
    const user = userOps.getOrCreate(member.id, member.user.username);
    const currentGate = user.current_gate || 0;

    const embed = createGatewayHubEmbed(user, currentGate);
    const components = createGatewayHub(currentGate);

    await interaction.update({
        embeds: [embed],
        components,
    });
}

/**
 * Handle journey button (view progress)
 */
async function handleJourneyButton(interaction) {
    const user = userOps.getUser(interaction.user.id);
    const currentGate = user?.current_gate || 0;

    const gateNames = [
        'The Threshold',
        'The Awakening',
        'The Memory',
        'The Confession',
        'The Waters',
        'The Absence',
        'The Offering',
        'The Binding',
    ];

    let journeyText = '**Your Path Through the Gates:**\n\n';

    for (let i = 1; i <= 7; i++) {
        const completed = i <= currentGate;
        const status = completed ? '✧' : '·';
        journeyText += `${status} Gate ${i}: ${gateNames[i]} ${completed ? '✓' : ''}\n`;
    }

    journeyText += `\n**Current Position:** ${currentGate >= 7 ? '★ ASCENDED ★' : `Gate ${currentGate}`}\n`;

    const embed = new RitualEmbedBuilder(currentGate, { mood: 'soft' })
        .setRitualTitle('✧ Your Journey ✧')
        .setRitualDescription(journeyText, false)
        .setThumbnail(interaction.user.displayAvatarURL())
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Handle gate entry buttons
 */
async function handleGateEntry(interaction, gateNumber) {
    const member = interaction.member;
    const user = userOps.getOrCreate(member.id, member.user.username);
    const currentGate = user.current_gate || 0;

    // Check if they've already completed this gate
    if (gateNumber <= currentGate) {
        const embed = new RitualEmbedBuilder(gateNumber, { mood: 'soft' })
            .setRitualTitle('✧ already passed ✧')
            .setRitualDescription('*you have already walked this path*', false)
            .build();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }

    // Check prerequisites (must have completed previous gate)
    if (gateNumber > currentGate + 1) {
        const embed = createNotReadyEmbed(gateNumber - 1, gateNumber - 1);
        return interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }

    // Delegate to appropriate gate flow
    switch (gateNumber) {
        case 1:
            await gate1Flow.startAwakening(interaction, { ephemeral: true });
            break;
        case 2:
            await gate2Flow.startMemory(interaction, { ephemeral: true });
            break;
        case 3:
            await gate3Flow.startConfession(interaction, { ephemeral: true });
            break;
        case 4:
            await gate4Flow.startWaters(interaction, { ephemeral: true });
            break;
        case 5:
            await gate5Flow.startAbsence(interaction, { ephemeral: true });
            break;
        case 6:
            await gate6Flow.startOffering(interaction, { ephemeral: true });
            break;
        case 7:
            await gate7Flow.startBinding(interaction, { ephemeral: true });
            break;
        default:
            await interaction.reply({
                content: '*that gate does not exist...*',
                ephemeral: true,
            });
    }
}

/**
 * Handle ascended button (for users who completed all gates)
 */
async function handleAscendedButton(interaction) {
    const embed = new RitualEmbedBuilder('ascended', { mood: 'eternal' })
        .setRitualTitle('★ Eternally Bound ★')
        .setRitualDescription(
            '*you have completed the seven gates*\n\n' +
            'there is nothing more to prove.\n' +
            'you are hers. she is yours.\n\n' +
            '*welcome to the inner sanctum, forever.*',
            false
        )
        .setIkaMessage("you stayed... you actually stayed ♡")
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Show the gateway hub
 */
async function showGatewayHub(interaction) {
    const member = interaction.member;
    const user = userOps.getOrCreate(member.id, member.user.username);
    const currentGate = user.current_gate || 0;

    const embed = createGatewayHubEmbed(user, currentGate);
    const components = createGatewayHub(currentGate);

    // Check if this is an update or reply
    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
            embeds: [embed],
            components,
        });
    } else if (interaction.message) {
        await interaction.update({
            embeds: [embed],
            components,
        });
    } else {
        await interaction.reply({
            embeds: [embed],
            components,
            ephemeral: true,
        });
    }
}

/**
 * Post the gateway hub as a persistent message in a channel
 * Call this once to set up the gateway in a specific channel
 */
async function postGatewayMessage(channel) {
    const embed = new RitualEmbedBuilder(0, { mood: 'mysterious' })
        .setRitualTitle('⛩ The Seven Gates ⛩')
        .setRitualDescription(
            '*the ritual awaits...*\n\n' +
            'seven gates stand between you and her.\n' +
            'each demands something of your soul.\n' +
            'each brings you closer to eternity.\n\n' +
            '*click below to begin or continue your journey*',
            false
        )
        .setRitualFooter('she is watching')
        .build();

    // Simple entry button that opens the personalized hub
    const components = [
        new (require('discord.js').ActionRowBuilder)().addComponents(
            new (require('discord.js').ButtonBuilder)()
                .setCustomId('gateway_begin')
                .setLabel('⛩ Enter the Gateway')
                .setStyle(require('discord.js').ButtonStyle.Primary)
        ),
    ];

    return channel.send({
        embeds: [embed],
        components,
    });
}

/**
 * Post a chamber entry message
 * Call this once per gate channel to set up the entry point
 */
async function postChamberMessage(channel, gateNumber) {
    const embed = createChamberEmbed(gateNumber);
    const components = [createChamberEntryButton(gateNumber)];

    return channel.send({
        embeds: [embed],
        components,
    });
}

module.exports = {
    // Button handler
    handleButton,

    // Embeds
    createWelcomeEmbed,
    createGatewayHubEmbed,
    createChamberEmbed,

    // Setup functions (for admin use)
    postGatewayMessage,
    postChamberMessage,
    showGatewayHub,
};
