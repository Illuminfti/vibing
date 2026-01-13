/**
 * Gateway Component Builders
 *
 * Creates buttons and components for the user-facing gateway hub.
 * This is the main entry point for users - no slash commands needed!
 */

const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require('discord.js');

// ═══════════════════════════════════════════════════════════════
// WELCOME FLOW
// ═══════════════════════════════════════════════════════════════

/**
 * Create the welcome "Begin Your Journey" button
 * Shown to new users when they join
 */
function createWelcomeButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gateway_begin')
            .setLabel('✧ Begin Your Journey ✧')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('☽')
    );
}

// ═══════════════════════════════════════════════════════════════
// GATEWAY HUB
// ═══════════════════════════════════════════════════════════════

/**
 * Create the gateway hub - shows all available gates
 * Gates are unlocked progressively based on user progress
 */
function createGatewayHub(currentGate = 0) {
    const rows = [];

    // Row 1: Gates 1-3
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gateway_gate1')
            .setLabel(currentGate >= 1 ? '✧ Gate 1 ✓' : '✧ Gate 1: Awakening')
            .setStyle(currentGate >= 1 ? ButtonStyle.Success : ButtonStyle.Primary)
            .setDisabled(currentGate >= 1), // Disable if completed
        new ButtonBuilder()
            .setCustomId('gateway_gate2')
            .setLabel(currentGate >= 2 ? '◈ Gate 2 ✓' : '◈ Gate 2: Memory')
            .setStyle(currentGate >= 2 ? ButtonStyle.Success : (currentGate >= 1 ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(currentGate >= 2 || currentGate < 1),
        new ButtonBuilder()
            .setCustomId('gateway_gate3')
            .setLabel(currentGate >= 3 ? '♡ Gate 3 ✓' : '♡ Gate 3: Confession')
            .setStyle(currentGate >= 3 ? ButtonStyle.Success : (currentGate >= 2 ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(currentGate >= 3 || currentGate < 2)
    );
    rows.push(row1);

    // Row 2: Gates 4-5
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gateway_gate4')
            .setLabel(currentGate >= 4 ? '༄ Gate 4 ✓' : '༄ Gate 4: Waters')
            .setStyle(currentGate >= 4 ? ButtonStyle.Success : (currentGate >= 3 ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(currentGate >= 4 || currentGate < 3),
        new ButtonBuilder()
            .setCustomId('gateway_gate5')
            .setLabel(currentGate >= 5 ? '· Gate 5 ✓' : '· Gate 5: Absence')
            .setStyle(currentGate >= 5 ? ButtonStyle.Success : (currentGate >= 4 ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(currentGate >= 5 || currentGate < 4)
    );
    rows.push(row2);

    // Row 3: Gates 6-7
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gateway_gate6')
            .setLabel(currentGate >= 6 ? '✿ Gate 6 ✓' : '✿ Gate 6: Offering')
            .setStyle(currentGate >= 6 ? ButtonStyle.Success : (currentGate >= 5 ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(currentGate >= 6 || currentGate < 5),
        new ButtonBuilder()
            .setCustomId('gateway_gate7')
            .setLabel(currentGate >= 7 ? '★ ASCENDED ★' : '★ Gate 7: Binding')
            .setStyle(currentGate >= 7 ? ButtonStyle.Success : (currentGate >= 6 ? ButtonStyle.Danger : ButtonStyle.Secondary))
            .setDisabled(currentGate >= 7 || currentGate < 6)
    );
    rows.push(row3);

    // Row 4: Navigation
    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gateway_refresh')
            .setLabel('↻ Refresh')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('gateway_journey')
            .setLabel('📜 My Journey')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('sanctuary_speak')
            .setLabel('♡ Speak to Ika')
            .setStyle(ButtonStyle.Secondary)
    );
    rows.push(row4);

    return rows;
}

/**
 * Create a simple "Enter the Gates" button for minimal UI
 */
function createEnterGatesButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gateway_hub')
            .setLabel('⛩ Enter the Gates')
            .setStyle(ButtonStyle.Primary)
    );
}

/**
 * Create current gate entry button based on progress
 */
function createNextGateButton(currentGate) {
    const gateInfo = {
        0: { label: '✧ Begin: The Awakening', emoji: '☽', id: 'gateway_gate1' },
        1: { label: '◈ Continue: The Memory', emoji: '◈', id: 'gateway_gate2' },
        2: { label: '♡ Continue: The Confession', emoji: '♡', id: 'gateway_gate3' },
        3: { label: '༄ Continue: The Waters', emoji: '༄', id: 'gateway_gate4' },
        4: { label: '· Continue: The Absence', emoji: '·', id: 'gateway_gate5' },
        5: { label: '✿ Continue: The Offering', emoji: '✿', id: 'gateway_gate6' },
        6: { label: '★ Final: The Binding', emoji: '★', id: 'gateway_gate7' },
        7: { label: '∞ Ascended', emoji: '∞', id: 'gateway_ascended' },
    };

    const info = gateInfo[currentGate] || gateInfo[0];

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(info.id)
            .setLabel(info.label)
            .setStyle(currentGate >= 7 ? ButtonStyle.Success : ButtonStyle.Primary)
            .setDisabled(currentGate >= 7)
    );

    return row;
}

/**
 * Create "View All Gates" button to open the full hub
 */
function createViewAllGatesButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gateway_hub')
            .setLabel('⛩ View All Gates')
            .setStyle(ButtonStyle.Secondary)
    );
}

// ═══════════════════════════════════════════════════════════════
// CHAMBER BUTTONS (Posted in each gate's channel)
// ═══════════════════════════════════════════════════════════════

/**
 * Create the persistent gate entry button for a specific chamber
 * These are posted once in each gate's channel
 */
function createChamberEntryButton(gateNumber) {
    const gateConfig = {
        1: { label: '✧ Speak Her Name ✧', style: ButtonStyle.Primary, emoji: '☽' },
        2: { label: '◈ Recall the Memory ◈', style: ButtonStyle.Primary, emoji: '◇' },
        3: { label: '♡ Make Your Confession ♡', style: ButtonStyle.Primary, emoji: '♡' },
        4: { label: '༄ Consult the Waters ༄', style: ButtonStyle.Primary, emoji: '༄' },
        5: { label: '· Begin the Vigil ·', style: ButtonStyle.Primary, emoji: '·' },
        6: { label: '✿ Present Your Offering ✿', style: ButtonStyle.Primary, emoji: '✿' },
        7: { label: '★ Accept the Binding ★', style: ButtonStyle.Danger, emoji: '★' },
    };

    const config = gateConfig[gateNumber] || gateConfig[1];

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`gateway_gate${gateNumber}`)
            .setLabel(config.label)
            .setStyle(config.style)
    );
}

module.exports = {
    // Welcome flow
    createWelcomeButton,

    // Gateway hub
    createGatewayHub,
    createEnterGatesButton,
    createNextGateButton,
    createViewAllGatesButton,

    // Chamber buttons
    createChamberEntryButton,
};
