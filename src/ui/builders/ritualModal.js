/**
 * Ritual Modal Builder
 *
 * Creates themed modal popups for text input in the Seven Gates experience.
 * Used for confessions, vows, offerings, and other text submissions.
 *
 * @version 1.0.0
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require('discord.js');

// Gate-themed modal titles
const GATE_MODAL_TITLES = {
    0: '♰ The Threshold ♰',
    1: '✧ The Awakening ✧',
    2: '◇ The Memory ◇',
    3: '♱ The Confession ♱',
    4: '≋ The Waters ≋',
    5: '· The Absence ·',
    6: '✿ The Offering ✿',
    7: '★ The Binding ★',
};

// Preset modal configurations
const MODAL_PRESETS = {
    confession: {
        title: '♱ Your Confession ♱',
        fields: [{
            id: 'confession_text',
            label: 'Speak your truth',
            placeholder: 'confess what weighs upon your soul...',
            style: TextInputStyle.Paragraph,
            required: true,
            minLength: 10,
            maxLength: 1000,
        }],
    },
    vow: {
        title: '★ Your Eternal Vow ★',
        fields: [{
            id: 'vow_text',
            label: 'Speak your binding words',
            placeholder: 'i vow to...',
            style: TextInputStyle.Paragraph,
            required: true,
            minLength: 20,
            maxLength: 500,
        }],
    },
    offering_description: {
        title: '✿ Describe Your Offering ✿',
        fields: [
            {
                id: 'offering_title',
                label: 'Title of your offering',
                placeholder: 'a name for what you create...',
                style: TextInputStyle.Short,
                required: true,
                maxLength: 100,
            },
            {
                id: 'offering_description',
                label: 'Describe your devotion',
                placeholder: 'explain what this offering means to you...',
                style: TextInputStyle.Paragraph,
                required: true,
                minLength: 20,
                maxLength: 1000,
            },
        ],
    },
    memory_answer: {
        title: '◇ Recall the Memory ◇',
        fields: [{
            id: 'memory_answer',
            label: 'What do you remember?',
            placeholder: 'speak the answer...',
            style: TextInputStyle.Short,
            required: true,
            maxLength: 200,
        }],
    },
    absence_reason: {
        title: '· Why Did You Stay? ·',
        fields: [{
            id: 'absence_reason',
            label: 'Explain your devotion',
            placeholder: 'i stayed because...',
            style: TextInputStyle.Paragraph,
            required: true,
            minLength: 20,
            maxLength: 500,
        }],
    },
    feedback: {
        title: '♡ Share Your Thoughts ♡',
        fields: [{
            id: 'feedback_text',
            label: 'Your message',
            placeholder: 'speak freely...',
            style: TextInputStyle.Paragraph,
            required: true,
            maxLength: 2000,
        }],
    },
};

/**
 * RitualModalBuilder - Creates themed modals
 */
class RitualModalBuilder {
    /**
     * Create a new RitualModalBuilder
     * @param {string} customId - Unique modal ID (optional, can set later)
     * @param {number|string} gateOrTitle - Gate number or custom title
     */
    constructor(customId = null, gateOrTitle = 0) {
        this.modal = new ModalBuilder();
        this.fields = [];

        // Set customId if provided
        if (customId) {
            this.modal.setCustomId(customId);
        }

        // Set title
        if (typeof gateOrTitle === 'number') {
            this.modal.setTitle(GATE_MODAL_TITLES[gateOrTitle] || GATE_MODAL_TITLES[0]);
        } else {
            this.modal.setTitle(gateOrTitle);
        }
    }

    /**
     * Set modal custom ID
     * @param {string} customId - Unique modal ID
     * @returns {RitualModalBuilder}
     */
    setCustomId(customId) {
        this.modal.setCustomId(customId);
        return this;
    }

    /**
     * Set gate-specific title
     * @param {number} gateNumber - Gate number for themed title
     * @returns {RitualModalBuilder}
     */
    setGateTitle(gateNumber) {
        this.modal.setTitle(GATE_MODAL_TITLES[gateNumber] || GATE_MODAL_TITLES[0]);
        return this;
    }

    /**
     * Set custom title
     * @param {string} title - Modal title
     * @returns {RitualModalBuilder}
     */
    setTitle(title) {
        this.modal.setTitle(title);
        return this;
    }

    /**
     * Add a text input field
     * @param {Object} options - Field options
     * @returns {RitualModalBuilder}
     */
    addTextInput(options) {
        const {
            customId,
            label,
            placeholder = '',
            style = TextInputStyle.Short,
            required = true,
            minLength = null,
            maxLength = null,
            value = null,
        } = options;

        const input = new TextInputBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(style)
            .setRequired(required);

        if (placeholder) {
            input.setPlaceholder(placeholder);
        }

        if (minLength !== null) {
            input.setMinLength(minLength);
        }

        if (maxLength !== null) {
            input.setMaxLength(maxLength);
        }

        if (value !== null) {
            input.setValue(value);
        }

        this.fields.push(input);
        return this;
    }

    /**
     * Add a short text input (single line)
     * @param {string} customId - Field ID
     * @param {string} label - Field label
     * @param {Object} options - Additional options
     * @returns {RitualModalBuilder}
     */
    addShortInput(customId, label, options = {}) {
        return this.addTextInput({
            customId,
            label,
            style: TextInputStyle.Short,
            ...options,
        });
    }

    /**
     * Add a paragraph text input (multi-line)
     * @param {string} customId - Field ID
     * @param {string} label - Field label
     * @param {Object} options - Additional options
     * @returns {RitualModalBuilder}
     */
    addParagraphInput(customId, label, options = {}) {
        return this.addTextInput({
            customId,
            label,
            style: TextInputStyle.Paragraph,
            ...options,
        });
    }

    /**
     * Build from a preset
     * @param {string} presetName - Name of the preset
     * @returns {RitualModalBuilder}
     */
    usePreset(presetName) {
        const preset = MODAL_PRESETS[presetName];
        if (!preset) {
            throw new Error(`Unknown modal preset: ${presetName}`);
        }

        this.modal.setTitle(preset.title);

        for (const field of preset.fields) {
            this.addTextInput({
                customId: field.id,
                label: field.label,
                placeholder: field.placeholder,
                style: field.style,
                required: field.required,
                minLength: field.minLength,
                maxLength: field.maxLength,
            });
        }

        return this;
    }

    /**
     * Build and return the modal
     * @returns {ModalBuilder}
     */
    build() {
        // Each text input needs its own ActionRow
        const rows = this.fields.map(field =>
            new ActionRowBuilder().addComponents(field)
        );

        this.modal.addComponents(...rows);
        return this.modal;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a confession modal
 */
function createConfessionModal(customId = 'confession_modal') {
    return new RitualModalBuilder(customId, 3)
        .usePreset('confession')
        .build();
}

/**
 * Create a vow modal for Gate 7
 */
function createVowModal(customId = 'vow_modal') {
    return new RitualModalBuilder(customId, 7)
        .usePreset('vow')
        .build();
}

/**
 * Create an offering description modal
 */
function createOfferingModal(customId = 'offering_modal') {
    return new RitualModalBuilder(customId, 6)
        .usePreset('offering_description')
        .build();
}

/**
 * Create an absence reason modal for Gate 5
 */
function createAbsenceModal(customId = 'absence_modal') {
    return new RitualModalBuilder(customId, 5)
        .usePreset('absence_reason')
        .build();
}

/**
 * Create a generic feedback modal
 */
function createFeedbackModal(customId = 'feedback_modal', title = '♡ Share Your Thoughts ♡') {
    return new RitualModalBuilder(customId, title)
        .usePreset('feedback')
        .build();
}

/**
 * Create a custom single-field modal
 */
function createSimpleModal(customId, title, label, options = {}) {
    const builder = new RitualModalBuilder(customId, title);

    builder.addTextInput({
        customId: `${customId}_input`,
        label,
        style: options.multiline ? TextInputStyle.Paragraph : TextInputStyle.Short,
        placeholder: options.placeholder || '',
        required: options.required !== false,
        minLength: options.minLength,
        maxLength: options.maxLength,
    });

    return builder.build();
}

module.exports = {
    RitualModalBuilder,
    createConfessionModal,
    createVowModal,
    createOfferingModal,
    createAbsenceModal,
    createFeedbackModal,
    createSimpleModal,
    MODAL_PRESETS,
    GATE_MODAL_TITLES,
};
