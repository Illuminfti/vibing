/**
 * Sanctuary Component Builders
 *
 * Creates persistent buttons for the "Sanctuary" message
 * where users can always interact with Ika.
 */

const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');

/**
 * Create the main sanctuary button row (row 1)
 */
function createSanctuaryRow1() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('sanctuary_journey')
            .setLabel('✧ My Journey ✧')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('sanctuary_speak')
            .setLabel('♡ Speak to Ika ♡')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('sanctuary_faithful')
            .setLabel('The Faithful')
            .setStyle(ButtonStyle.Secondary)
    );
}

/**
 * Create the secondary sanctuary button row (row 2)
 */
function createSanctuaryRow2() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('sanctuary_devotion')
            .setLabel('Daily Devotion')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('sanctuary_offerings')
            .setLabel('My Offerings')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('sanctuary_mysteries')
            .setLabel('Mysteries')
            .setStyle(ButtonStyle.Secondary)
    );
}

/**
 * Create all sanctuary rows
 */
function createSanctuaryComponents() {
    return [createSanctuaryRow1(), createSanctuaryRow2()];
}

/**
 * Create the "Speak to Ika" modal
 */
function createSpeakModal() {
    const modal = new ModalBuilder()
        .setCustomId('sanctuary_speak_modal')
        .setTitle('『 Speak to Ika 』');

    const messageInput = new TextInputBuilder()
        .setCustomId('sanctuary_message')
        .setLabel('what would you like to say?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('she is listening...')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

    return modal;
}

/**
 * Create "Share Journey" button for ephemeral content
 */
function createShareJourneyButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('sanctuary_share')
            .setLabel('📤 Share Publicly')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('sanctuary_close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary)
    );
}

module.exports = {
    createSanctuaryRow1,
    createSanctuaryRow2,
    createSanctuaryComponents,
    createSpeakModal,
    createShareJourneyButton,
};
