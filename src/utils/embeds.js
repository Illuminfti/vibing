const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const config = require('../config');
const path = require('path');

// Occult symbols for decoration
const symbols = {
    occult: ['♰', '☪︎', '⛧', '✞', '☾', '☽'],
    cute: ['♡', '✧', '･ﾟ', '✿', '♪', '˚'],
    mixed: ['♰', '♡', '✧', '☪︎', '･ﾟ'],
};

/**
 * Create a standard gate embed
 */
function createGateEmbed(title, description, color = config.colors.primary) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
}

/**
 * Create embed with image attachment
 */
function createGateEmbedWithImage(title, description, imageName, color = config.colors.primary) {
    const imagePath = path.join(__dirname, '..', '..', 'images', imageName);
    const attachment = new AttachmentBuilder(imagePath, { name: imageName });

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setImage(`attachment://${imageName}`)
        .setTimestamp();

    return { embed, attachment };
}

/**
 * Wrap text in occult border
 */
function addOccultBorder(text) {
    return `✧･ﾟ\n${text}\n･ﾟ✧`;
}

/**
 * Wrap text in cute border
 */
function addCuteBorder(text) {
    return `♡･ﾟ✧\n${text}\n✧･ﾟ♡`;
}

/**
 * Wrap text in mixed border
 */
function addMixedBorder(text) {
    return `♰ ♡ ♰\n${text}\n♰ ♡ ♰`;
}

/**
 * Format offering for voting display
 */
function formatOffering(username, type, content) {
    let display = `♰ an offering arrives ♰\n\n**${username}** brings a gift for her.\n\n`;

    if (type === 'text') {
        display += `"${content}"`;
    } else if (type === 'image') {
        display += `[image attached]`;
    }

    display += '\n\nreact ✅ to accept their devotion.';
    return display;
}

/**
 * Format vow for voting display
 */
function formatVow(username, vow) {
    return `♰ a soul seeks entry ♰\n\n**${username}** speaks their vow:\n\n"${vow}"\n\nreact ✅ to witness them.`;
}

/**
 * Create waiting room welcome message
 */
function createWaitingRoomWelcome() {
    const text = `♰
╱   ╲
╱     ╲
╱  ♡    ╲
╱_________╲

can you hear her breathing?
she's so close to the surface.
say her name and she'll know you're here.

whisper it.`;

    return createGateEmbed(null, text);
}

/**
 * Create chamber puzzle embed
 */
function createChamberEmbed(gateNumber, title, puzzleText) {
    return createGateEmbed(
        `♰ GATE ${gateNumber} ♰\n${title}`,
        puzzleText,
        config.colors.primary
    );
}

/**
 * Create success embed for gate completion
 */
function createSuccessEmbed(message, gateNumber) {
    const footer = `[ gate ${gateNumber} complete. ]`;
    return createGateEmbed(
        null,
        addCuteBorder(message) + `\n\n${footer}`,
        config.colors.success
    );
}

/**
 * Create error embed
 */
function createErrorEmbed(message) {
    return createGateEmbed(
        null,
        message,
        config.colors.error
    );
}

/**
 * Get random symbol set
 */
function getRandomSymbols(type = 'mixed', count = 3) {
    const set = symbols[type] || symbols.mixed;
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(set[Math.floor(Math.random() * set.length)]);
    }
    return result.join(' ');
}

module.exports = {
    createGateEmbed,
    createGateEmbedWithImage,
    addOccultBorder,
    addCuteBorder,
    addMixedBorder,
    formatOffering,
    formatVow,
    createWaitingRoomWelcome,
    createChamberEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    getRandomSymbols,
    symbols,
};
