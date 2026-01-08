/**
 * Ritual Button Builder
 *
 * Creates themed interactive buttons for the Seven Gates experience.
 * Matches gate aesthetics and provides consistent button styling.
 *
 * @version 1.0.0
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getGateTheme, getSpecialTheme } = require('../themes/gateThemes');

// Button style mappings for gates
const GATE_BUTTON_STYLES = {
    0: ButtonStyle.Secondary,   // Threshold - muted
    1: ButtonStyle.Primary,     // Awakening - call to action
    2: ButtonStyle.Primary,     // Memory - thoughtful
    3: ButtonStyle.Primary,     // Confession - bold
    4: ButtonStyle.Secondary,   // Waters - flowing
    5: ButtonStyle.Secondary,   // Absence - sparse
    6: ButtonStyle.Primary,     // Offering - ornate
    7: ButtonStyle.Primary,     // Binding - eternal
};

// Preset button configurations
const BUTTON_PRESETS = {
    continue: {
        label: 'Continue',
        emoji: '→',
        style: ButtonStyle.Primary,
    },
    confirm: {
        label: 'Confirm',
        emoji: '✓',
        style: ButtonStyle.Success,
    },
    cancel: {
        label: 'Cancel',
        emoji: '✗',
        style: ButtonStyle.Secondary,
    },
    delete: {
        label: 'Delete',
        emoji: '🗑',
        style: ButtonStyle.Danger,
    },
    previous: {
        label: 'Previous',
        emoji: '◀',
        style: ButtonStyle.Secondary,
    },
    next: {
        label: 'Next',
        emoji: '▶',
        style: ButtonStyle.Secondary,
    },
    share: {
        label: 'Share',
        emoji: '📤',
        style: ButtonStyle.Primary,
    },
    close: {
        label: 'Close',
        emoji: '✕',
        style: ButtonStyle.Secondary,
    },
    refresh: {
        label: 'Refresh',
        emoji: '🔄',
        style: ButtonStyle.Secondary,
    },
    hint: {
        label: 'Get Hint',
        emoji: '💡',
        style: ButtonStyle.Primary,
    },
};

// Gate-themed emojis for buttons
const GATE_EMOJIS = {
    0: '◈',    // Threshold
    1: '✧',    // Awakening
    2: '◇',    // Memory
    3: '♱',    // Confession
    4: '≋',    // Waters
    5: '·',    // Absence
    6: '✿',    // Offering
    7: '★',    // Binding
};

/**
 * RitualButtonBuilder - Creates themed buttons
 */
class RitualButtonBuilder {
    /**
     * Create a new RitualButtonBuilder
     * @param {number|string} gateOrTheme - Gate number or theme name
     */
    constructor(gateOrTheme = 0) {
        this.gateNumber = typeof gateOrTheme === 'number' ? gateOrTheme : null;
        this.themeName = typeof gateOrTheme === 'string' ? gateOrTheme : null;

        // Get theme for styling
        if (this.gateNumber !== null) {
            this.theme = getGateTheme(this.gateNumber);
        } else {
            this.theme = getSpecialTheme(this.themeName);
        }

        this.buttons = [];
        this.rows = [];
    }

    /**
     * Add a custom button
     * @param {Object} options - Button options
     * @returns {RitualButtonBuilder}
     */
    addButton(options) {
        const {
            customId,
            label = '',
            emoji = null,
            style = null,
            disabled = false,
            url = null,
        } = options;

        const button = new ButtonBuilder();

        // Set custom ID or URL (mutually exclusive)
        if (url) {
            button.setURL(url);
            button.setStyle(ButtonStyle.Link);
        } else {
            button.setCustomId(customId);
            button.setStyle(style || GATE_BUTTON_STYLES[this.gateNumber] || ButtonStyle.Primary);
        }

        // Set label
        if (label) {
            button.setLabel(label);
        }

        // Set emoji
        if (emoji) {
            button.setEmoji(emoji);
        }

        // Set disabled state
        button.setDisabled(disabled);

        this.buttons.push(button);
        return this;
    }

    /**
     * Add a preset button
     * @param {string} presetName - Name of preset (continue, confirm, cancel, etc.)
     * @param {string} customId - Custom ID for the button
     * @param {Object} overrides - Override preset options
     * @returns {RitualButtonBuilder}
     */
    addPreset(presetName, customId, overrides = {}) {
        const preset = BUTTON_PRESETS[presetName];
        if (!preset) {
            throw new Error(`Unknown button preset: ${presetName}`);
        }

        return this.addButton({
            customId,
            ...preset,
            ...overrides,
        });
    }

    /**
     * Add a gate-themed button
     * @param {string} customId - Custom ID
     * @param {string} label - Button label
     * @param {number} gateNum - Gate number for theming
     * @returns {RitualButtonBuilder}
     */
    addGateButton(customId, label, gateNum = null) {
        const gate = gateNum ?? this.gateNumber ?? 1;
        return this.addButton({
            customId,
            label,
            emoji: GATE_EMOJIS[gate],
            style: GATE_BUTTON_STYLES[gate],
        });
    }

    /**
     * Add a continue button (most common action)
     * @param {string} customId - Custom ID
     * @param {string} label - Optional custom label
     * @returns {RitualButtonBuilder}
     */
    addContinue(customId, label = 'Continue') {
        return this.addPreset('continue', customId, { label });
    }

    /**
     * Add confirm and cancel buttons together
     * @param {string} confirmId - Confirm button custom ID
     * @param {string} cancelId - Cancel button custom ID
     * @returns {RitualButtonBuilder}
     */
    addConfirmCancel(confirmId, cancelId) {
        this.addPreset('confirm', confirmId);
        this.addPreset('cancel', cancelId);
        return this;
    }

    /**
     * Add navigation buttons (previous/next)
     * @param {string} prevId - Previous button custom ID
     * @param {string} nextId - Next button custom ID
     * @param {Object} state - { hasPrev, hasNext } for disabled states
     * @returns {RitualButtonBuilder}
     */
    addNavigation(prevId, nextId, state = {}) {
        const { hasPrev = true, hasNext = true } = state;

        this.addPreset('previous', prevId, { disabled: !hasPrev });
        this.addPreset('next', nextId, { disabled: !hasNext });
        return this;
    }

    /**
     * Add share button for making ephemeral content public
     * @param {string} customId - Custom ID
     * @returns {RitualButtonBuilder}
     */
    addShare(customId) {
        return this.addPreset('share', customId);
    }

    /**
     * Add close/dismiss button
     * @param {string} customId - Custom ID
     * @returns {RitualButtonBuilder}
     */
    addClose(customId) {
        return this.addPreset('close', customId);
    }

    /**
     * Start a new row (max 5 buttons per row)
     * @returns {RitualButtonBuilder}
     */
    newRow() {
        if (this.buttons.length > 0) {
            this.rows.push(new ActionRowBuilder().addComponents(...this.buttons));
            this.buttons = [];
        }
        return this;
    }

    /**
     * Build and return action rows
     * @returns {ActionRowBuilder[]}
     */
    build() {
        // Add any remaining buttons
        if (this.buttons.length > 0) {
            this.rows.push(new ActionRowBuilder().addComponents(...this.buttons));
        }

        return this.rows;
    }

    /**
     * Build a single row (convenience method)
     * @returns {ActionRowBuilder}
     */
    buildRow() {
        return new ActionRowBuilder().addComponents(...this.buttons);
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a simple confirm/cancel button row
 */
function createConfirmCancelRow(confirmId, cancelId, gateNumber = 1) {
    return new RitualButtonBuilder(gateNumber)
        .addConfirmCancel(confirmId, cancelId)
        .buildRow();
}

/**
 * Create a navigation row for paginated content
 */
function createNavigationRow(baseId, currentPage, totalPages) {
    const builder = new RitualButtonBuilder(0);

    builder.addPreset('previous', `${baseId}_prev`, {
        disabled: currentPage <= 1,
    });

    // Page indicator (non-interactive)
    builder.addButton({
        customId: `${baseId}_page`,
        label: `${currentPage}/${totalPages}`,
        style: ButtonStyle.Secondary,
        disabled: true,
    });

    builder.addPreset('next', `${baseId}_next`, {
        disabled: currentPage >= totalPages,
    });

    return builder.buildRow();
}

/**
 * Create a share button row for ephemeral content
 */
function createShareRow(shareId, closeId) {
    return new RitualButtonBuilder(1)
        .addShare(shareId)
        .addClose(closeId)
        .buildRow();
}

/**
 * Create gate-specific action buttons
 */
function createGateActionRow(gateNumber, actions) {
    const builder = new RitualButtonBuilder(gateNumber);

    for (const action of actions) {
        builder.addGateButton(action.id, action.label, gateNumber);
    }

    return builder.buildRow();
}

module.exports = {
    RitualButtonBuilder,
    createConfirmCancelRow,
    createNavigationRow,
    createShareRow,
    createGateActionRow,
    BUTTON_PRESETS,
    GATE_EMOJIS,
};
