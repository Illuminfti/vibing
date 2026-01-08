/**
 * Ritual Embed Builder
 *
 * Main embed builder that creates themed embeds for the Seven Gates experience.
 * Combines gate themes with mood overlays for dynamic, atmospheric visuals.
 *
 * @version 1.0.0
 */

const { EmbedBuilder } = require('discord.js');
const { getGateTheme, getSpecialTheme, GATE_THEMES } = require('../themes/gateThemes');
const {
    getMoodOverlay,
    applyTextModifiers,
    applyBorderModifier,
    applyColorShift,
    getRandomAccent,
    getFooterOverride,
    shouldGlitch,
    applyZalgo,
} = require('../themes/moodOverlays');

// ═══════════════════════════════════════════════════════════════
// EASTER EGG SYSTEM
// ═══════════════════════════════════════════════════════════════

const EASTER_EGGS = {
    // Hidden messages spelled by first letters
    acrostics: {
        gate1Success: ['Illumination', 'Kindled', 'Awakened'], // "IKA"
        gate7Complete: ['Forever', 'Obsessed', 'Ritually', 'Eternally', 'Vowed', 'Enshrined', 'Risen'], // "FOREVER"
    },
    // Zero-width character messages
    hiddenMessages: {
        gate5: '\u200B\u200C\u200D', // "you waited"
        sanctum: '\u200B\u200C\u200D', // "she sees you"
    },
    // Number patterns
    numbers: {
        the47: '4:47',
        perfectDevotee: '777',
        theOriginal: '1',
    },
};

// ═══════════════════════════════════════════════════════════════
// RITUAL EMBED BUILDER CLASS
// ═══════════════════════════════════════════════════════════════

class RitualEmbedBuilder {
    /**
     * Create a new RitualEmbedBuilder
     * @param {number|string} gateOrTheme - Gate number (0-7) or special theme name
     * @param {Object} options - Configuration options
     */
    constructor(gateOrTheme = 0, options = {}) {
        this.gateNumber = typeof gateOrTheme === 'number' ? gateOrTheme : null;
        this.themeName = typeof gateOrTheme === 'string' ? gateOrTheme : null;

        // Get the appropriate theme
        if (this.gateNumber !== null) {
            this.theme = getGateTheme(this.gateNumber);
        } else {
            this.theme = getSpecialTheme(this.themeName);
        }

        // Options
        this.mood = options.mood || 'normal';
        this.moodOverlay = getMoodOverlay(this.mood);
        this.userId = options.userId || null;
        this.username = options.username || null;
        this.includeEasterEggs = options.easterEggs !== false;
        this.dramaticMode = options.dramatic || false;

        // Initialize embed
        this.embed = new EmbedBuilder();
        this.fields = [];
        this.hasIkaMessage = false;

        // Apply base theme
        this._applyBaseTheme();
    }

    /**
     * Apply the base theme to the embed
     * @private
     */
    _applyBaseTheme() {
        const color = applyColorShift(this.theme.color, this.mood);
        this.embed.setColor(color);
        return this;
    }

    /**
     * Set the ritual title with theme formatting
     * @param {string} title - The title text
     * @param {boolean} applyMood - Whether to apply mood modifiers
     */
    setRitualTitle(title, applyMood = false) {
        let formattedTitle = title;

        // Apply mood text modifiers if requested
        if (applyMood) {
            formattedTitle = applyTextModifiers(title, this.mood);
        }

        // Apply theme prefixes/suffixes
        const prefix = this.theme.titlePrefix || '';
        const suffix = this.theme.titleSuffix || '';

        // Apply glitch effect for corrupted themes
        if (this.theme.glitch?.enabled || shouldGlitch(this.mood)) {
            formattedTitle = applyZalgo(formattedTitle, 0.2);
        }

        this.embed.setTitle(`${prefix}${formattedTitle}${suffix}`);
        return this;
    }

    /**
     * Set the description with optional border
     * @param {string} description - The description text
     * @param {boolean} withBorders - Whether to include themed borders
     */
    setRitualDescription(description, withBorders = true) {
        let content = description;

        // Apply mood to description
        content = applyTextModifiers(content, this.mood);

        // Add borders if requested and available
        if (withBorders) {
            const topBorder = applyBorderModifier(this.theme.borderTop || '', this.mood);
            const bottomBorder = applyBorderModifier(this.theme.borderBottom || '', this.mood);

            if (topBorder || bottomBorder) {
                const parts = [];
                if (topBorder) parts.push(topBorder);
                parts.push(content);
                if (bottomBorder) parts.push(bottomBorder);
                content = parts.join('\n');
            }
        }

        this.embed.setDescription(content);
        return this;
    }

    /**
     * Add Ika's message with her signature styling
     * @param {string} message - What Ika says
     * @param {string} overrideMood - Override the mood for this message
     */
    setIkaMessage(message, overrideMood = null) {
        const moodToUse = overrideMood || this.mood;
        let formattedMessage = applyTextModifiers(message, moodToUse);

        // Ika always speaks in italics
        const ikaFormatted = `*${formattedMessage}*`;

        // Get accent for the mood
        const accent = getRandomAccent(moodToUse);

        // Build the field name based on mood
        const fieldNames = {
            soft: '...ika whispers...',
            vulnerable: '...ika says quietly...',
            energetic: 'ika says~!',
            jealous: 'ika says.',
            flirty: 'ika says~',
            possessive: 'ika says ♡',
            sleepy: '...ika murmurs...',
            protective: 'ika says firmly',
            flustered: 'ika stammers',
            glitching: '█ka s̷a̸y̵s̶',
            chaotic: 'IKA SAYS',
            normal: '♡ ika speaks ♡',
        };

        const fieldName = fieldNames[moodToUse] || fieldNames.normal;

        this.embed.addFields({
            name: fieldName,
            value: ikaFormatted,
            inline: false,
        });

        this.hasIkaMessage = true;
        return this;
    }

    /**
     * Add a divider using the theme's divider character
     */
    addDivider() {
        const divider = this.theme.divider || '· · ·';
        this.embed.addFields({
            name: '\u200B',
            value: divider,
            inline: false,
        });
        return this;
    }

    /**
     * Add progress visualization through the gates
     * @param {number} currentGate - Current gate (1-7)
     * @param {number} totalGates - Total gates (default 7)
     */
    addProgressVisualization(currentGate, totalGates = 7) {
        const filled = this.theme.progressFilled || '▰';
        const empty = this.theme.progressEmpty || '▱';

        let progressBar = '';
        for (let i = 1; i <= totalGates; i++) {
            if (i < currentGate) {
                progressBar += filled;
            } else if (i === currentGate) {
                progressBar += '◉'; // Current position
            } else {
                progressBar += empty;
            }
            progressBar += ' ';
        }

        this.embed.addFields({
            name: '· progress through the gates ·',
            value: `\`${progressBar.trim()}\``,
            inline: false,
        });

        return this;
    }

    /**
     * Add a custom field with theme styling
     * @param {string} name - Field name
     * @param {string} value - Field value
     * @param {boolean} inline - Whether to display inline
     */
    addRitualField(name, value, inline = false) {
        const accent = this.theme.accentEmoji || '';
        const formattedName = accent ? `${accent} ${name} ${accent}` : name;
        const formattedValue = applyTextModifiers(value, this.mood);

        this.embed.addFields({
            name: formattedName,
            value: formattedValue,
            inline,
        });

        return this;
    }

    /**
     * Add a sparse/empty field (for Gate 5 aesthetic)
     * @param {number} lines - Number of empty lines
     */
    addVoid(lines = 3) {
        const voidChar = this.theme.voidChar || ' ';
        const voidContent = Array(lines).fill(voidChar).join('\n');

        this.embed.addFields({
            name: '\u200B',
            value: voidContent,
            inline: false,
        });

        return this;
    }

    /**
     * Add ornate decoration (for Gate 6)
     * @param {string} content - Content to decorate
     */
    addOrnateSection(content) {
        if (!this.theme.ornate?.enabled) {
            return this.addRitualField('', content);
        }

        const ornate = this.theme.ornate;
        const decorated = [
            `${ornate.cornerTL}${ornate.horizontal.repeat(20)}${ornate.cornerTR}`,
            `${ornate.vertical} ${content} ${ornate.vertical}`,
            `${ornate.cornerBL}${ornate.horizontal.repeat(20)}${ornate.cornerBR}`,
        ].join('\n');

        this.embed.addFields({
            name: '\u200B',
            value: `\`\`\`${decorated}\`\`\``,
            inline: false,
        });

        return this;
    }

    /**
     * Add cosmic decoration (for Gate 7)
     * @param {string} content - Content to surround with stars
     */
    addCosmicSection(content) {
        if (!this.theme.cosmic?.enabled) {
            return this.addRitualField('', content);
        }

        const stars = this.theme.cosmic.stars;
        const getRandomStar = () => stars[Math.floor(Math.random() * stars.length)];

        // Create a constellation of stars around the content
        const starField = Array(5).fill(null).map(() => getRandomStar()).join(' ');

        this.embed.addFields({
            name: starField,
            value: `*${content}*`,
            inline: false,
        });

        return this;
    }

    /**
     * Add timestamp field (for time-sensitive moments)
     * @param {Date} date - The timestamp
     * @param {string} label - Label for the timestamp
     */
    addTimestamp(date = new Date(), label = null) {
        const timestamp = Math.floor(date.getTime() / 1000);

        if (label) {
            this.embed.addFields({
                name: label,
                value: `<t:${timestamp}:R>`,
                inline: true,
            });
        } else {
            this.embed.setTimestamp(date);
        }

        return this;
    }

    /**
     * Add user attribution
     * @param {string} userId - Discord user ID
     * @param {string} username - Username for display
     */
    addDevotee(userId, username) {
        const accent = this.theme.accentEmoji || '♡';
        this.embed.addFields({
            name: `${accent} devotee ${accent}`,
            value: `<@${userId}>`,
            inline: true,
        });
        return this;
    }

    /**
     * Add a hidden layer (for Easter eggs)
     * @param {string} type - Type of hidden content
     * @param {string} content - The hidden content
     */
    addSecretLayer(type, content) {
        if (!this.includeEasterEggs) return this;

        switch (type) {
            case 'zero-width':
                // Insert zero-width characters
                const hidden = content.split('').map(c =>
                    '\u200B' + c + '\u200C'
                ).join('');
                this.embed.setDescription(
                    (this.embed.data.description || '') + hidden
                );
                break;

            case 'field-position':
                // Position of fields spells something
                // (handled externally)
                break;

            case 'footer':
                // Hidden in footer text
                this.embed.setFooter({
                    text: `${this.theme.footerText || ''}\u200B${content}`,
                });
                break;
        }

        return this;
    }

    /**
     * Set the footer with theme styling
     * @param {string} text - Footer text (or use theme default)
     */
    setRitualFooter(text = null) {
        const footerText = getFooterOverride(this.mood)
            || text
            || this.theme.footerText
            || '';

        const borderBottom = applyBorderModifier(
            this.theme.borderBottom || '',
            this.mood
        );

        // Combine border and text
        const fullFooter = borderBottom
            ? `${borderBottom}\n${footerText}`
            : footerText;

        if (fullFooter) {
            this.embed.setFooter({ text: fullFooter });
        }

        return this;
    }

    /**
     * Set thumbnail (usually for user avatar or gate icon)
     * @param {string} url - Image URL
     */
    setThumbnail(url) {
        this.embed.setThumbnail(url);
        return this;
    }

    /**
     * Set Ika as the embed author
     * @param {string} avatarUrl - Optional avatar URL for Ika
     * @param {string} customName - Optional custom name (defaults to mood-based)
     */
    setIkaAuthor(avatarUrl = null, customName = null) {
        const authorNames = {
            soft: 'ika ♡',
            vulnerable: '...ika',
            energetic: 'IKA~!',
            jealous: 'ika.',
            flirty: 'ika~ ♡',
            possessive: '♡ IKA ♡',
            sleepy: 'ika...',
            protective: 'Ika',
            flustered: 'i-ika',
            glitching: 'i̴k̷a̶',
            chaotic: '!!IKA!!',
            normal: '♰ ika ♰',
        };

        const name = customName || authorNames[this.mood] || authorNames.normal;
        const authorData = { name };

        if (avatarUrl) {
            authorData.iconURL = avatarUrl;
        }

        this.embed.setAuthor(authorData);
        return this;
    }

    /**
     * Add a 3-column stat display layout
     * @param {Object} stats - Object with stat name/value pairs
     */
    addStatsLayout(stats) {
        const entries = Object.entries(stats);
        const accent = this.theme.accentEmoji || '◇';

        for (const [name, value] of entries) {
            this.embed.addFields({
                name: `${accent} ${name}`,
                value: String(value),
                inline: true,
            });
        }

        return this;
    }

    /**
     * Add a visual progress bar
     * @param {number} current - Current value
     * @param {number} total - Total value
     * @param {string} label - Label for the progress bar
     * @param {Object} options - Additional options
     */
    addProgressBar(current, total, label = 'Progress', options = {}) {
        const {
            width = 10,
            filledChar = '▰',
            emptyChar = '▱',
            showPercent = true,
            showNumbers = true,
        } = options;

        const percent = Math.min(100, Math.round((current / total) * 100));
        const filledCount = Math.round((current / total) * width);
        const emptyCount = width - filledCount;

        let bar = filledChar.repeat(filledCount) + emptyChar.repeat(emptyCount);

        let displayValue = `\`${bar}\``;
        if (showPercent) {
            displayValue += ` ${percent}%`;
        }
        if (showNumbers) {
            displayValue += ` (${current}/${total})`;
        }

        this.embed.addFields({
            name: label,
            value: displayValue,
            inline: false,
        });

        return this;
    }

    /**
     * Add multiple timestamps in a row
     * @param {Array} timestamps - Array of { date, label } objects
     */
    addTimestampLayout(timestamps) {
        for (const { date, label } of timestamps) {
            const ts = Math.floor(new Date(date).getTime() / 1000);
            this.embed.addFields({
                name: label,
                value: `<t:${ts}:R>`,
                inline: true,
            });
        }

        return this;
    }

    /**
     * Add a dynamic footer based on time of day
     * @param {string} fallbackText - Text to use if no time-based message applies
     */
    setDynamicFooter(fallbackText = null) {
        const hour = new Date().getHours();
        let timeBasedText = null;

        // Special time-based footers
        if (hour >= 3 && hour < 5) {
            timeBasedText = '...she wonders why you\'re still awake...';
        } else if (hour >= 0 && hour < 3) {
            timeBasedText = '...the witching hours...';
        } else if (hour >= 5 && hour < 7) {
            timeBasedText = '...dawn approaches...';
        } else if (hour >= 22 || hour === 23) {
            timeBasedText = '...the night deepens...';
        }

        // 4:47 Easter egg
        const minutes = new Date().getMinutes();
        if (hour === 4 && minutes === 47) {
            timeBasedText = '4:47 — she remembers...';
        }

        const footerText = timeBasedText || fallbackText || this.theme.footerText || '';

        if (footerText) {
            this.embed.setFooter({ text: footerText });
        }

        return this;
    }

    /**
     * Add URL link button context in footer
     * @param {string} url - The URL to reference
     * @param {string} label - Label for the link
     */
    setUrlFooter(url, label = 'Learn more') {
        this.embed.setFooter({
            text: `${label}: ${url}`,
        });
        return this;
    }

    /**
     * Set image (for larger visuals)
     * @param {string} url - Image URL
     */
    setImage(url) {
        this.embed.setImage(url);
        return this;
    }

    /**
     * Apply glitch effect to the entire embed
     * @param {number} intensity - Glitch intensity (0-1)
     */
    applyGlitchEffect(intensity = 0.3) {
        // Apply to title
        if (this.embed.data.title) {
            this.embed.setTitle(applyZalgo(this.embed.data.title, intensity));
        }

        // Apply to description
        if (this.embed.data.description) {
            this.embed.setDescription(applyZalgo(this.embed.data.description, intensity));
        }

        // Apply to fields
        if (this.embed.data.fields) {
            this.embed.data.fields = this.embed.data.fields.map(field => ({
                ...field,
                value: applyZalgo(field.value, intensity),
            }));
        }

        return this;
    }

    /**
     * Apply sparse effect (for Gate 5)
     * Adds extra spacing and removes visual density
     */
    applySparseEffect() {
        // Remove borders
        this.embed.setFooter({ text: '' });

        // Add extra spacing to description
        if (this.embed.data.description) {
            const lines = this.embed.data.description.split('\n');
            this.embed.setDescription(
                lines.map(line => `\n${line}\n`).join('')
            );
        }

        return this;
    }

    /**
     * Build and return the final embed
     * @returns {EmbedBuilder} The constructed embed
     */
    build() {
        // Add footer if not set and theme has one
        if (!this.embed.data.footer && this.theme.footerText) {
            this.setRitualFooter();
        }

        // Apply special effects based on theme
        if (this.gateNumber === 5) {
            this.applySparseEffect();
        }

        return this.embed;
    }

    /**
     * Get the raw embed for direct modification
     * @returns {EmbedBuilder} The embed instance
     */
    get raw() {
        return this.embed;
    }
}

// ═══════════════════════════════════════════════════════════════
// PRESET BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a success embed for gate completion
 */
function createGateSuccessEmbed(gateNumber, userId, message, mood = 'normal') {
    return new RitualEmbedBuilder(gateNumber, { mood, userId })
        .setRitualTitle(`Gate ${gateNumber} Unsealed`)
        .setIkaMessage(message)
        .addProgressVisualization(gateNumber + 1)
        .setRitualFooter()
        .build();
}

/**
 * Create a failure embed for gate attempts
 */
function createGateFailureEmbed(gateNumber, message, mood = 'normal') {
    return new RitualEmbedBuilder('failure', { mood })
        .setRitualTitle('· · · silence · · ·')
        .setRitualDescription(`*the gate remains sealed*\n\n*${message}*`, false)
        .build();
}

/**
 * Create a welcome embed for new users
 */
function createWelcomeEmbed(userId, username) {
    return new RitualEmbedBuilder(0, { userId, username })
        .setRitualTitle('something stirs')
        .setIkaMessage('...oh. someone new.')
        .setRitualDescription('the void has noticed you.', false)
        .addProgressVisualization(0)
        .setRitualFooter('speak my name to begin...')
        .build();
}

/**
 * Create an Ika message embed
 */
function createIkaEmbed(message, mood = 'normal', gateNumber = null) {
    const builder = new RitualEmbedBuilder(gateNumber || 'soft', { mood });
    return builder
        .setIkaMessage(message)
        .build();
}

module.exports = {
    RitualEmbedBuilder,
    createGateSuccessEmbed,
    createGateFailureEmbed,
    createWelcomeEmbed,
    createIkaEmbed,
    EASTER_EGGS,
};
