/**
 * Paginated Embed Builder
 *
 * Creates multi-page embeds with navigation buttons for browsing
 * large amounts of content in the Seven Gates experience.
 *
 * @version 1.0.0
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { RitualEmbedBuilder } = require('./ritualEmbed');

/**
 * PaginatedEmbed - Creates paginated embed views
 */
class PaginatedEmbed {
    /**
     * Create a new PaginatedEmbed
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.pages = [];
        this.currentPage = 0;
        this.gateNumber = options.gateNumber || 0;
        this.mood = options.mood || 'normal';
        this.timeout = options.timeout || 120000; // 2 minutes default
        this.showPageNumbers = options.showPageNumbers !== false;
        this.customId = options.customId || `paginated_${Date.now()}`;
        this.userId = options.userId || null; // Only allow this user to navigate
    }

    /**
     * Add a page to the pagination
     * @param {EmbedBuilder|Function} embedOrBuilder - Embed or builder function
     * @returns {PaginatedEmbed}
     */
    addPage(embedOrBuilder) {
        this.pages.push(embedOrBuilder);
        return this;
    }

    /**
     * Add multiple pages
     * @param {Array} pages - Array of embeds or builder functions
     * @returns {PaginatedEmbed}
     */
    addPages(pages) {
        this.pages.push(...pages);
        return this;
    }

    /**
     * Create pages from an array of items
     * @param {Array} items - Items to paginate
     * @param {number} itemsPerPage - Items per page
     * @param {Function} formatter - Function to format items into embed
     * @returns {PaginatedEmbed}
     */
    fromArray(items, itemsPerPage, formatter) {
        const totalPages = Math.ceil(items.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const pageItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
            const embed = formatter(pageItems, i + 1, totalPages);
            this.pages.push(embed);
        }

        return this;
    }

    /**
     * Build the navigation buttons
     * @param {number} page - Current page (0-indexed)
     * @returns {ActionRowBuilder}
     */
    _buildNavigation(page) {
        const totalPages = this.pages.length;

        const firstButton = new ButtonBuilder()
            .setCustomId(`${this.customId}_first`)
            .setEmoji('⏮')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0);

        const prevButton = new ButtonBuilder()
            .setCustomId(`${this.customId}_prev`)
            .setEmoji('◀')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0);

        const pageIndicator = new ButtonBuilder()
            .setCustomId(`${this.customId}_page`)
            .setLabel(`${page + 1} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const nextButton = new ButtonBuilder()
            .setCustomId(`${this.customId}_next`)
            .setEmoji('▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1);

        const lastButton = new ButtonBuilder()
            .setCustomId(`${this.customId}_last`)
            .setEmoji('⏭')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1);

        return new ActionRowBuilder().addComponents(
            firstButton,
            prevButton,
            pageIndicator,
            nextButton,
            lastButton
        );
    }

    /**
     * Get the current page embed
     * @param {number} page - Page number (0-indexed)
     * @returns {EmbedBuilder}
     */
    _getEmbed(page) {
        const pageContent = this.pages[page];

        // If it's a function, call it
        if (typeof pageContent === 'function') {
            return pageContent(page, this.pages.length);
        }

        return pageContent;
    }

    /**
     * Send the paginated embed and set up collectors
     * @param {Interaction} interaction - Discord interaction
     * @param {Object} options - Send options
     * @returns {Promise<Message>}
     */
    async send(interaction, options = {}) {
        if (this.pages.length === 0) {
            throw new Error('No pages added to PaginatedEmbed');
        }

        const ephemeral = options.ephemeral !== false;

        // Send initial message
        const embed = this._getEmbed(0);
        const components = this.pages.length > 1 ? [this._buildNavigation(0)] : [];

        let message;
        if (interaction.deferred || interaction.replied) {
            message = await interaction.editReply({
                embeds: [embed],
                components,
            });
        } else {
            message = await interaction.reply({
                embeds: [embed],
                components,
                ephemeral,
                fetchReply: true,
            });
        }

        // If only one page, no need for collector
        if (this.pages.length <= 1) {
            return message;
        }

        // Set up button collector
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: this.timeout,
            filter: (i) => {
                // Only allow the original user to navigate
                if (this.userId && i.user.id !== this.userId) {
                    i.reply({
                        content: '*this is not your journey to navigate...*',
                        ephemeral: true,
                    });
                    return false;
                }
                return i.customId.startsWith(this.customId);
            },
        });

        collector.on('collect', async (buttonInteraction) => {
            const action = buttonInteraction.customId.replace(`${this.customId}_`, '');

            switch (action) {
                case 'first':
                    this.currentPage = 0;
                    break;
                case 'prev':
                    this.currentPage = Math.max(0, this.currentPage - 1);
                    break;
                case 'next':
                    this.currentPage = Math.min(this.pages.length - 1, this.currentPage + 1);
                    break;
                case 'last':
                    this.currentPage = this.pages.length - 1;
                    break;
            }

            const newEmbed = this._getEmbed(this.currentPage);
            const newComponents = [this._buildNavigation(this.currentPage)];

            await buttonInteraction.update({
                embeds: [newEmbed],
                components: newComponents,
            });
        });

        collector.on('end', async () => {
            // Disable buttons when collector ends
            try {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.customId}_expired`)
                        .setLabel('Navigation expired')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                await message.edit({
                    components: [disabledRow],
                });
            } catch {
                // Message may have been deleted
            }
        });

        return message;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUICK BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a paginated lore viewer
 */
function createLorePagination(loreEntries, gateNumber = 0, userId = null) {
    const paginated = new PaginatedEmbed({
        gateNumber,
        userId,
        customId: `lore_${Date.now()}`,
    });

    for (const entry of loreEntries) {
        const embed = new RitualEmbedBuilder(gateNumber, { mood: 'soft' })
            .setRitualTitle(entry.title)
            .setRitualDescription(entry.content)
            .setRitualFooter(entry.source || 'discovered in the archives')
            .build();

        paginated.addPage(embed);
    }

    return paginated;
}

/**
 * Create a paginated list viewer
 */
function createListPagination(items, options = {}) {
    const {
        itemsPerPage = 10,
        title = 'Items',
        gateNumber = 0,
        formatItem = (item, index) => `${index + 1}. ${item}`,
        userId = null,
    } = options;

    const paginated = new PaginatedEmbed({
        gateNumber,
        userId,
        customId: `list_${Date.now()}`,
    });

    paginated.fromArray(items, itemsPerPage, (pageItems, page, total) => {
        const offset = (page - 1) * itemsPerPage;
        const formattedItems = pageItems.map((item, i) =>
            formatItem(item, offset + i)
        ).join('\n');

        return new RitualEmbedBuilder(gateNumber, { mood: 'normal' })
            .setRitualTitle(title)
            .setRitualDescription(formattedItems, false)
            .setRitualFooter(`page ${page} of ${total}`)
            .build();
    });

    return paginated;
}

/**
 * Create a paginated gallery (for offerings, etc.)
 */
function createGalleryPagination(entries, options = {}) {
    const {
        title = 'Gallery',
        gateNumber = 6,
        userId = null,
    } = options;

    const paginated = new PaginatedEmbed({
        gateNumber,
        userId,
        customId: `gallery_${Date.now()}`,
    });

    for (const entry of entries) {
        const builder = new RitualEmbedBuilder(gateNumber, { mood: 'normal' })
            .setRitualTitle(entry.title || title);

        if (entry.description) {
            builder.setRitualDescription(entry.description);
        }

        if (entry.author) {
            builder.addDevotee(entry.authorId, entry.author);
        }

        if (entry.image) {
            builder.setImage(entry.image);
        }

        if (entry.timestamp) {
            builder.addTimestamp(new Date(entry.timestamp), 'created');
        }

        paginated.addPage(builder.build());
    }

    return paginated;
}

module.exports = {
    PaginatedEmbed,
    createLorePagination,
    createListPagination,
    createGalleryPagination,
};
