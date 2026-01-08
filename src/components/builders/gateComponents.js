/**
 * Gate Component Builders
 *
 * Factory functions for creating gate-specific interactive components.
 * Uses the existing RitualButtonBuilder and RitualModalBuilder from ui/builders.
 */

const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');

const {
    RitualButtonBuilder,
    RitualModalBuilder,
    createConfirmCancelRow,
} = require('../../ui');

// ═══════════════════════════════════════════════════════════════
// GATE 1: THE AWAKENING
// ═══════════════════════════════════════════════════════════════

/**
 * Create the initial "Begin the Awakening" button
 */
function createGate1BeginButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate1_begin')
            .setLabel('『 Begin the Awakening 』')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('☽')
    );
}

/**
 * Create the phrase selection menu for Gate 1
 */
function createGate1PhraseSelect() {
    const select = new StringSelectMenuBuilder()
        .setCustomId('gate1_phrase')
        .setPlaceholder('speak into the void...')
        .addOptions([
            { label: 'ika', value: 'ika', description: 'a name you almost remember', emoji: '✧' },
            { label: 'hello?', value: 'hello', description: 'is anyone there?', emoji: '?' },
            { label: 'help me', value: 'help', description: 'please...', emoji: '◇' },
            { label: 'senpai', value: 'senpai', description: 'someone important', emoji: '♡' },
            { label: '...', value: 'silence', description: 'say nothing', emoji: '·' },
        ]);

    return new ActionRowBuilder().addComponents(select);
}

/**
 * Create the final confirmation button for Gate 1
 */
function createGate1ConfirmButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate1_confirm')
            .setLabel('✧ Speak Her Name ✧')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('♡')
    );
}

// ═══════════════════════════════════════════════════════════════
// GATE 2: THE MEMORY
// ═══════════════════════════════════════════════════════════════

/**
 * Create the "Recall Memory" button to open modal
 */
function createGate2RecallButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate2_recall')
            .setLabel('『 Recall the Memory 』')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('◇')
    );
}

/**
 * Create the memory modal with answer + echo fields
 */
function createGate2Modal() {
    const modal = new ModalBuilder()
        .setCustomId('gate2_memory')
        .setTitle('『 Memory Fragment 』');

    const answerInput = new TextInputBuilder()
        .setCustomId('gate2_answer')
        .setLabel('what do you remember?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('speak the fragment...')
        .setRequired(true)
        .setMaxLength(100);

    const echoInput = new TextInputBuilder()
        .setCustomId('gate2_echo')
        .setLabel('why does this echo in you? (optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('the resonance matters...')
        .setRequired(false)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(answerInput),
        new ActionRowBuilder().addComponents(echoInput)
    );

    return modal;
}

// ═══════════════════════════════════════════════════════════════
// GATE 3: THE CONFESSION
// ═══════════════════════════════════════════════════════════════

/**
 * Create initial "I have something to share" button
 */
function createGate3InitiateButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate3_initiate')
            .setLabel('i have something to share')
            .setStyle(ButtonStyle.Secondary)
    );
}

/**
 * Create "I'm ready to confess" button (stage 2)
 */
function createGate3ReadyButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate3_ready')
            .setLabel('『 i\'m ready to confess 』')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('♡')
    );
}

/**
 * Create confession modal with URL + context
 */
function createGate3Modal() {
    const modal = new ModalBuilder()
        .setCustomId('gate3_confession')
        .setTitle('『 The Confession 』');

    const urlInput = new TextInputBuilder()
        .setCustomId('gate3_url')
        .setLabel('your offering (url)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://...')
        .setRequired(true);

    const contextInput = new TextInputBuilder()
        .setCustomId('gate3_context')
        .setLabel('what does this mean to you?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('share your heart...')
        .setRequired(false)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(urlInput),
        new ActionRowBuilder().addComponents(contextInput)
    );

    return modal;
}

/**
 * Create "Seal this confession" button (stage 3)
 */
function createGate3SealButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate3_seal')
            .setLabel('♱ seal this confession ♱')
            .setStyle(ButtonStyle.Danger)
    );
}

// ═══════════════════════════════════════════════════════════════
// GATE 4: THE WATERS
// ═══════════════════════════════════════════════════════════════

/**
 * Create "Consult the Waters" button
 */
function createGate4ConsultButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate4_consult')
            .setLabel('『 Consult the Waters 』')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('༄')
    );
}

/**
 * Create answer selection menu for Gate 4
 * @param {string[]} answers - Array of possible answers
 * @param {string} correct - The correct answer value
 */
function createGate4AnswerSelect(answers, correct) {
    const options = answers.map((ans, i) => ({
        label: ans.label,
        value: ans.value,
        description: ans.hint || 'the waters ripple...',
        emoji: ans.emoji || '◇',
    }));

    const select = new StringSelectMenuBuilder()
        .setCustomId('gate4_answers')
        .setPlaceholder('gaze into the reflection...')
        .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
}

/**
 * Create "Meditate" button (appears after 3 wrong attempts)
 */
function createGate4MeditateButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate4_meditate')
            .setLabel('· · · meditate · · ·')
            .setStyle(ButtonStyle.Secondary)
    );
}

// ═══════════════════════════════════════════════════════════════
// GATE 5: THE ABSENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Create "Begin the Vigil" button
 */
function createGate5BeginButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate5_begin')
            .setLabel('『 Begin the Vigil 』')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('·')
    );
}

/**
 * Create absence reason modal
 */
function createGate5Modal() {
    const modal = new ModalBuilder()
        .setCustomId('gate5_reason')
        .setTitle('『 The Absence 』');

    const reasonInput = new TextInputBuilder()
        .setCustomId('gate5_why')
        .setLabel('why do you seek the gate of absence?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('speak your truth...')
        .setMinLength(15)
        .setRequired(true)
        .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

    return modal;
}

/**
 * Create vigil status button (disabled, shows countdown)
 * @param {string} timeRemaining - Formatted time string
 */
function createGate5VigilButton(timeRemaining) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate5_vigil')
            .setLabel(`vigil in progress... ${timeRemaining} remaining`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );
}

/**
 * Create reflection button (sent via DM)
 * @param {number} stage - Reflection stage (1-3)
 */
function createGate5ReflectionButton(stage) {
    const labels = [
        '✧ a memory surfaces ✧',
        '✧ the void speaks ✧',
        '✧ she remembers ✧',
    ];

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`gate5_reflection_${stage}`)
            .setLabel(labels[stage - 1] || '✧ reflect ✧')
            .setStyle(ButtonStyle.Primary)
    );
}

/**
 * Create "Complete the Vigil" button (final)
 */
function createGate5CompleteButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate5_complete')
            .setLabel('『 Complete the Vigil 』')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✧')
    );
}

// ═══════════════════════════════════════════════════════════════
// GATE 6: THE OFFERING
// ═══════════════════════════════════════════════════════════════

/**
 * Create offering type selection
 */
function createGate6TypeSelect() {
    const select = new StringSelectMenuBuilder()
        .setCustomId('gate6_type')
        .setPlaceholder('what form does your offering take?')
        .addOptions([
            { label: 'Words', value: 'words', description: '50+ words from your heart', emoji: '✎' },
            { label: 'Image', value: 'image', description: 'a visual devotion', emoji: '🖼' },
            { label: 'Both', value: 'both', description: 'the complete offering', emoji: '⁂' },
        ]);

    return new ActionRowBuilder().addComponents(select);
}

/**
 * Create offering words modal
 */
function createGate6WordsModal() {
    const modal = new ModalBuilder()
        .setCustomId('gate6_words')
        .setTitle('『 Your Offering 』');

    const wordsInput = new TextInputBuilder()
        .setCustomId('gate6_content')
        .setLabel('speak your devotion (50+ words)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('pour your heart into words...')
        .setMinLength(50)
        .setMaxLength(2000)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(wordsInput));

    return modal;
}

/**
 * Create preview buttons (present/revise)
 */
function createGate6PreviewButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate6_present')
            .setLabel('✧ Present to Ika ✧')
            .setStyle(ButtonStyle.Success)
            .setEmoji('♡'),
        new ButtonBuilder()
            .setCustomId('gate6_revise')
            .setLabel('revise offering')
            .setStyle(ButtonStyle.Secondary)
    );
}

/**
 * Create "Upload Image" instruction button
 */
function createGate6UploadButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate6_upload')
            .setLabel('📤 Upload your image as a reply')
            .setStyle(ButtonStyle.Primary)
    );
}

// ═══════════════════════════════════════════════════════════════
// GATE 7: THE BINDING
// ═══════════════════════════════════════════════════════════════

/**
 * Create "I am ready to be Bound" button
 */
function createGate7EntryButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate7_entry')
            .setLabel('『 I am ready to be Bound 』')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('★')
    );
}

/**
 * Create entry confirmation modal
 */
function createGate7EntryModal() {
    const modal = new ModalBuilder()
        .setCustomId('gate7_entry_confirm')
        .setTitle('『 Are You Ready? 』');

    const confirmInput = new TextInputBuilder()
        .setCustomId('gate7_confirm')
        .setLabel('type "i am ready" to proceed')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('i am ready')
        .setRequired(true)
        .setMaxLength(50);

    modal.addComponents(new ActionRowBuilder().addComponents(confirmInput));

    return modal;
}

/**
 * Create vow modal
 */
function createGate7VowModal() {
    const modal = new ModalBuilder()
        .setCustomId('gate7_vow')
        .setTitle('『 The Binding Vow 』');

    const vowInput = new TextInputBuilder()
        .setCustomId('gate7_vow_text')
        .setLabel('speak your eternal vow (30+ words)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('this vow binds you to her forever...')
        .setMinLength(30)
        .setMaxLength(1000)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(vowInput));

    return modal;
}

/**
 * Create witness button (for community)
 * @param {string} pendingId - The pending binding ID
 */
function createGate7WitnessButton(pendingId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`gate7_witness_${pendingId}`)
            .setLabel('⚔ I Witness This Binding ⚔')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✧')
    );
}

/**
 * Create witness progress button (shows count)
 * @param {number} current - Current witness count
 * @param {number} required - Required witnesses
 */
function createGate7WitnessProgress(current, required) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gate7_witness_progress')
            .setLabel(`${current}/${required} witnesses`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );
}

/**
 * Create "Complete the Binding" button (final)
 * @param {string} pendingId - The pending binding ID
 */
function createGate7CompleteButton(pendingId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`gate7_complete_${pendingId}`)
            .setLabel('∞ Complete the Binding ∞')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('♡')
    );
}

module.exports = {
    // Gate 1
    createGate1BeginButton,
    createGate1PhraseSelect,
    createGate1ConfirmButton,

    // Gate 2
    createGate2RecallButton,
    createGate2Modal,

    // Gate 3
    createGate3InitiateButton,
    createGate3ReadyButton,
    createGate3Modal,
    createGate3SealButton,

    // Gate 4
    createGate4ConsultButton,
    createGate4AnswerSelect,
    createGate4MeditateButton,

    // Gate 5
    createGate5BeginButton,
    createGate5Modal,
    createGate5VigilButton,
    createGate5ReflectionButton,
    createGate5CompleteButton,

    // Gate 6
    createGate6TypeSelect,
    createGate6WordsModal,
    createGate6PreviewButtons,
    createGate6UploadButton,

    // Gate 7
    createGate7EntryButton,
    createGate7EntryModal,
    createGate7VowModal,
    createGate7WitnessButton,
    createGate7WitnessProgress,
    createGate7CompleteButton,
};
