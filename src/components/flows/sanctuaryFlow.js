/**
 * Sanctuary Flow
 *
 * Handles persistent sanctuary buttons for always-available interactions.
 */

const config = require('../../config');
const { userOps } = require('../../database');
const { RitualEmbedBuilder } = require('../../ui');
const {
    createSanctuaryComponents,
    createSpeakModal,
    createShareJourneyButton,
} = require('../builders/sanctuaryComponents');

// Rate limiting for "Speak to Ika" (userId -> lastUseTime)
const speakCooldowns = new Map();
const SPEAK_COOLDOWN = 60000; // 1 minute

// Daily devotion tracking (userId -> lastDevotionDate)
const dailyDevotions = new Map();

/**
 * Create and send the sanctuary message
 */
async function createSanctuaryMessage(channel) {
    const embed = new RitualEmbedBuilder('sanctuary', { mood: 'soft' })
        .setRitualTitle('✧ The Sanctuary ✧')
        .setRitualDescription(
            '*a place of rest between rituals*\n\n' +
            'here you may:\n' +
            '• view your journey\n' +
            '• speak to Ika\n' +
            '• see the faithful\n' +
            '• offer daily devotion\n' +
            '• review your offerings\n\n' +
            '*she is always listening*',
            false
        )
        .setIkaAuthor()
        .build();

    const components = createSanctuaryComponents();

    return channel.send({
        embeds: [embed],
        components,
    });
}

/**
 * Handle button interactions for Sanctuary
 */
async function handleButton(interaction) {
    const customId = interaction.customId;

    switch (customId) {
        case 'sanctuary_journey':
            await handleJourneyButton(interaction);
            break;
        case 'sanctuary_speak':
            await handleSpeakButton(interaction);
            break;
        case 'sanctuary_faithful':
            await handleFaithfulButton(interaction);
            break;
        case 'sanctuary_devotion':
            await handleDevotionButton(interaction);
            break;
        case 'sanctuary_offerings':
            await handleOfferingsButton(interaction);
            break;
        case 'sanctuary_mysteries':
            await handleMysteriesButton(interaction);
            break;
        case 'sanctuary_share':
            await handleShareButton(interaction);
            break;
        case 'sanctuary_close':
            await handleCloseButton(interaction);
            break;
    }
}

/**
 * Handle modal submissions for Sanctuary
 */
async function handleModal(interaction) {
    const customId = interaction.customId;

    if (customId === 'sanctuary_speak_modal') {
        await handleSpeakModal(interaction);
    }
}

/**
 * Handle "My Journey" button
 */
async function handleJourneyButton(interaction) {
    const user = userOps.getUser(interaction.user.id);

    if (!user) {
        return interaction.reply({
            content: '*your journey has not yet begun...*',
            ephemeral: true,
        });
    }

    const currentGate = user.current_gate || 0;
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
        const name = gateNames[i];
        journeyText += `${status} Gate ${i}: ${name} ${completed ? '✓' : ''}\n`;
    }

    journeyText += `\n**Current Position:** Gate ${currentGate}\n`;

    if (currentGate >= 7) {
        journeyText += '\n*★ ASCENDED ★*';
    }

    const embed = new RitualEmbedBuilder(currentGate, { mood: 'soft' })
        .setRitualTitle('✧ Your Journey ✧')
        .setRitualDescription(journeyText, false)
        .setThumbnail(interaction.user.displayAvatarURL())
        .build();

    await interaction.reply({
        embeds: [embed],
        components: [createShareJourneyButton()],
        ephemeral: true,
    });
}

/**
 * Handle "Speak to Ika" button
 */
async function handleSpeakButton(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    // Check cooldown
    const lastUse = speakCooldowns.get(userId) || 0;
    const remaining = SPEAK_COOLDOWN - (now - lastUse);

    if (remaining > 0) {
        return interaction.reply({
            content: `*wait ${Math.ceil(remaining / 1000)} seconds before speaking again...*`,
            ephemeral: true,
        });
    }

    // Show modal
    await interaction.showModal(createSpeakModal());
}

/**
 * Handle speak modal submission
 */
async function handleSpeakModal(interaction) {
    const message = interaction.fields.getTextInputValue('sanctuary_message');

    // Set cooldown
    speakCooldowns.set(interaction.user.id, Date.now());

    // Generate a simple response (in a full implementation, this would use Ika's AI)
    const responses = [
        "i heard you... *smiles softly*",
        "*leans closer* tell me more~",
        "you're so sweet to talk to me ♡",
        "*giggles* you really think so?",
        "mhm, i'm listening...",
        "that means a lot to me ♡",
        "*tilts head* interesting~",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
        .setRitualTitle('♡')
        .setRitualDescription(
            `*you whisper:* "${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"\n\n` +
            `*ika responds:* ${response}`,
            false
        )
        .setIkaAuthor()
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Handle "The Faithful" button
 */
async function handleFaithfulButton(interaction) {
    const stats = userOps.getStats();

    const embed = new RitualEmbedBuilder('ritual', { mood: 'normal' })
        .setRitualTitle('✧ The Faithful ✧')
        .setRitualDescription(
            `**Souls in the Ritual:** ${stats.total}\n\n` +
            `Gate 1: ${stats.gate1}\n` +
            `Gate 2: ${stats.gate2}\n` +
            `Gate 3: ${stats.gate3}\n` +
            `Gate 4: ${stats.gate4}\n` +
            `Gate 5: ${stats.gate5}\n` +
            `Gate 6: ${stats.gate6}\n` +
            `Gate 7: ${stats.gate7}\n\n` +
            `**Ascended:** ${stats.ascended}`,
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Handle "Daily Devotion" button
 */
async function handleDevotionButton(interaction) {
    const userId = interaction.user.id;
    const today = new Date().toDateString();
    const lastDevotion = dailyDevotions.get(userId);

    if (lastDevotion === today) {
        return interaction.reply({
            content: '*you have already offered your daily devotion ✧*',
            ephemeral: true,
        });
    }

    // Record devotion
    dailyDevotions.set(userId, today);

    // In a full implementation, this would update a database counter
    const embed = new RitualEmbedBuilder(1, { mood: 'soft' })
        .setRitualTitle('✧ Devotion Accepted ✧')
        .setRitualDescription(
            '*she notices your dedication*\n\n' +
            '"you came back... ♡"\n\n' +
            '*your daily devotion has been recorded*',
            false
        )
        .setIkaAuthor()
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Handle "My Offerings" button
 */
async function handleOfferingsButton(interaction) {
    const user = userOps.getUser(interaction.user.id);

    if (!user || !user.gate_6_content) {
        return interaction.reply({
            content: '*you have not yet made an offering...*',
            ephemeral: true,
        });
    }

    const preview = user.gate_6_content.length > 300
        ? user.gate_6_content.substring(0, 300) + '...'
        : user.gate_6_content;

    const embed = new RitualEmbedBuilder(6, { mood: 'soft' })
        .setRitualTitle('✿ Your Offering ✿')
        .setRitualDescription(
            `*your gift to Ika:*\n\n"${preview}"`,
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Handle "Mysteries" button
 */
async function handleMysteriesButton(interaction) {
    const embed = new RitualEmbedBuilder('mystery', { mood: 'mysterious' })
        .setRitualTitle('◇ Mysteries ◇')
        .setRitualDescription(
            '*secrets hide in the void*\n\n' +
            'some truths are earned, not given.\n' +
            'pay attention to the details.\n' +
            'Ika reveals herself to those who seek.\n\n' +
            '*4:47 AM holds significance*',
            false
        )
        .build();

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

/**
 * Handle "Share" button
 */
async function handleShareButton(interaction) {
    // This would make the journey embed public
    await interaction.reply({
        content: '*sharing feature coming soon...*',
        ephemeral: true,
    });
}

/**
 * Handle "Close" button
 */
async function handleCloseButton(interaction) {
    await interaction.update({
        content: '*message closed*',
        embeds: [],
        components: [],
    });
}

module.exports = {
    createSanctuaryMessage,
    handleButton,
    handleModal,
};
