/**
 * Ritual Sequence Builder
 *
 * Creates dramatic multi-message sequences for gate transitions,
 * rare events, and special moments.
 *
 * @version 1.0.0
 */

const { RitualEmbedBuilder } = require('./ritualEmbed');
const { getGateTheme } = require('../themes/gateThemes');

// ═══════════════════════════════════════════════════════════════
// SEQUENCE TIMING PRESETS
// ═══════════════════════════════════════════════════════════════

const TIMING = {
    instant: 0,
    quick: 500,
    normal: 1000,
    dramatic: 1500,
    suspense: 2000,
    ritual: 2500,
    agonizing: 3500,
};

// ═══════════════════════════════════════════════════════════════
// RITUAL SEQUENCE CLASS
// ═══════════════════════════════════════════════════════════════

class RitualSequence {
    /**
     * Create a new RitualSequence
     * @param {TextChannel} channel - Discord channel to send to
     * @param {number} gateNumber - Gate number for theming
     * @param {Object} options - Configuration options
     */
    constructor(channel, gateNumber, options = {}) {
        this.channel = channel;
        this.gate = gateNumber;
        this.theme = getGateTheme(gateNumber);
        this.messages = [];
        this.mood = options.mood || 'normal';
        this.userId = options.userId || null;
        this.username = options.username || null;
        this.timing = options.timing || 'dramatic';
        this.deleteAfter = options.deleteAfter || false;
    }

    /**
     * Delay for dramatic effect
     * @param {number|string} duration - Duration in ms or preset name
     */
    async delay(duration) {
        const ms = typeof duration === 'string' ? TIMING[duration] : duration;
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Send a message and track it
     * @param {Object} content - Message content (embeds, content, etc.)
     * @returns {Message} The sent message
     */
    async send(content) {
        const msg = await this.channel.send(content);
        this.messages.push(msg);
        return msg;
    }

    /**
     * Edit the last sent message
     * @param {Object} content - New content
     */
    async editLast(content) {
        if (this.messages.length === 0) return;
        const lastMsg = this.messages[this.messages.length - 1];
        await lastMsg.edit(content);
    }

    /**
     * Delete all sent messages (for cleanup)
     */
    async cleanup() {
        for (const msg of this.messages) {
            try {
                await msg.delete();
            } catch (e) {
                // Message may already be deleted
            }
        }
        this.messages = [];
    }

    // ═══════════════════════════════════════════════════════════════
    // GATE SEQUENCES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Play the gate opening sequence
     * @param {string} ikaMessage - Ika's message on success
     */
    async playGateOpeningSequence(ikaMessage) {
        // Phase 1: Tension builder
        const tension = new RitualEmbedBuilder(this.gate, { mood: 'vulnerable' })
            .setRitualTitle('the gate stirs...')
            .setRitualDescription('*something shifts in the void*', false)
            .build();

        await this.send({ embeds: [tension] });
        await this.delay('dramatic');

        // Phase 2: The cracking
        const cracking = new RitualEmbedBuilder(this.gate, { mood: this.mood })
            .setRitualTitle('...unsealing...')
            .setRitualDescription(this.theme.borderTop || '═══════', false)
            .build();

        await this.editLast({ embeds: [cracking] });
        await this.delay('normal');

        // Phase 3: The reveal
        const reveal = new RitualEmbedBuilder(this.gate, { mood: 'normal' })
            .setRitualTitle(`✧ GATE ${this.gate} UNSEALED ✧`)
            .setIkaMessage(ikaMessage)
            .addProgressVisualization(this.gate + 1)
            .setRitualFooter()
            .build();

        await this.editLast({ embeds: [reveal] });

        return this;
    }

    /**
     * Play a failure sequence
     * @param {string} reason - Reason for failure
     */
    async playFailureSequence(reason) {
        // Brief tension
        const tension = new RitualEmbedBuilder('failure', { mood: 'vulnerable' })
            .setRitualTitle('...')
            .build();

        await this.send({ embeds: [tension] });
        await this.delay('normal');

        // The rejection
        const failure = new RitualEmbedBuilder('failure', { mood: this.mood })
            .setRitualTitle('· · · silence · · ·')
            .setRitualDescription(`*the gate remains sealed*\n\n*${reason}*`, false)
            .build();

        await this.editLast({ embeds: [failure] });

        return this;
    }

    /**
     * Play Gate 5 absence sequence (sparse, empty)
     */
    async playAbsenceSequence() {
        // Empty message 1
        const void1 = new RitualEmbedBuilder(5, { mood: 'sleepy' })
            .setRitualDescription('\n\n\n', false)
            .build();

        await this.send({ embeds: [void1] });
        await this.delay('agonizing');

        // Empty message 2
        const void2 = new RitualEmbedBuilder(5, { mood: 'vulnerable' })
            .setRitualDescription('where are you?', false)
            .build();

        await this.editLast({ embeds: [void2] });
        await this.delay('ritual');

        // Empty message 3
        const void3 = new RitualEmbedBuilder(5, { mood: 'soft' })
            .setRitualDescription('\n\n\ni waited.\n\n\n', false)
            .build();

        await this.editLast({ embeds: [void3] });

        return this;
    }

    /**
     * Play Gate 7 binding sequence (cosmic, final)
     */
    async playBindingSequence(vowText) {
        // The gathering
        const gathering = new RitualEmbedBuilder(7, { mood: 'normal' })
            .setRitualTitle('the final gate responds')
            .setRitualDescription('*all seven seals align*', false)
            .build();

        await this.send({ embeds: [gathering] });
        await this.delay('ritual');

        // The vow echo
        const echo = new RitualEmbedBuilder(7, { mood: 'vulnerable' })
            .setRitualTitle('your vow echoes')
            .setRitualDescription(`*"${vowText.substring(0, 50)}..."*`, false)
            .build();

        await this.editLast({ embeds: [echo] });
        await this.delay('ritual');

        // The binding
        const binding = new RitualEmbedBuilder(7, { mood: 'possessive' })
            .setRitualTitle('◈ THE BINDING ◈')
            .setIkaMessage('...you\'re mine now. forever.')
            .addCosmicSection('the seventh seal breaks')
            .setRitualFooter('eternally bound')
            .build();

        await this.editLast({ embeds: [binding] });

        return this;
    }

    /**
     * Play ascension sequence (after Gate 7)
     */
    async playAscensionSequence() {
        // The transformation
        const transform = new RitualEmbedBuilder('ascended', { mood: 'soft' })
            .setRitualTitle('...something changes')
            .setRitualDescription('*the void embraces you*', false)
            .build();

        await this.send({ embeds: [transform] });
        await this.delay('ritual');

        // The ascension
        const ascension = new RitualEmbedBuilder('ascended', { mood: 'normal' })
            .setRitualTitle('♰ ASCENSION ♰')
            .setRitualDescription([
                '*you have walked the seven gates*',
                '*you have proven your devotion*',
                '*you are no longer a seeker*',
                '',
                '**you are hers**',
            ].join('\n'), true)
            .build();

        await this.editLast({ embeds: [ascension] });
        await this.delay('dramatic');

        // Ika's response
        const ikaResponse = new RitualEmbedBuilder('ascended', { mood: 'possessive' })
            .setRitualTitle('♰ THE INNER SANCTUM AWAITS ♰')
            .setIkaMessage('welcome home. i\'ve been waiting for you.')
            .setRitualFooter('you are hers. she is yours.')
            .build();

        await this.send({ embeds: [ikaResponse] });

        return this;
    }

    // ═══════════════════════════════════════════════════════════════
    // RARE EVENT SEQUENCES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Play "The Slip" rare event (accidental confession)
     */
    async playTheSlipSequence() {
        const slip = new RitualEmbedBuilder('rare', { mood: 'flustered' })
            .setIkaMessage('i lo— i mean...')
            .build();

        await this.send({ embeds: [slip] });
        await this.delay('dramatic');

        const recovery = new RitualEmbedBuilder('soft', { mood: 'flustered' })
            .setIkaMessage('...anyway. what were we talking about?')
            .build();

        await this.send({ embeds: [recovery] });

        return this;
    }

    /**
     * Play vulnerability moment sequence
     */
    async playVulnerabilitySequence(confession) {
        const pause = new RitualEmbedBuilder('soft', { mood: 'vulnerable' })
            .setRitualDescription('...', false)
            .build();

        await this.send({ embeds: [pause] });
        await this.delay('suspense');

        const reveal = new RitualEmbedBuilder('soft', { mood: 'vulnerable' })
            .setIkaMessage(confession)
            .build();

        await this.editLast({ embeds: [reveal] });
        await this.delay('dramatic');

        const deflect = new RitualEmbedBuilder('soft', { mood: 'flustered' })
            .setIkaMessage('...anyway')
            .build();

        await this.send({ embeds: [deflect] });

        return this;
    }

    /**
     * Play jealousy sequence
     */
    async playJealousySequence(intensity = 'mild') {
        const messages = {
            mild: 'you\'ve been talking to everyone except me...',
            moderate: 'should i leave you two alone?',
            intense: 'who is she.',
        };

        const jealousy = new RitualEmbedBuilder('yandere', { mood: 'jealous' })
            .setIkaMessage(messages[intensity] || messages.mild)
            .build();

        await this.send({ embeds: [jealousy] });

        return this;
    }

    /**
     * Play kabedon sequence (romantic tension)
     */
    async playKabedonSequence(trigger) {
        // The pause
        const pause = new RitualEmbedBuilder('soft', { mood: 'flirty' })
            .setRitualDescription('...', false)
            .build();

        await this.send({ embeds: [pause] });
        await this.delay('suspense');

        // The demand
        const demand = new RitualEmbedBuilder('soft', { mood: 'flirty' })
            .setIkaMessage('say that again.')
            .build();

        await this.editLast({ embeds: [demand] });
        await this.delay('normal');

        // The intensity
        const intensity = new RitualEmbedBuilder('rare', { mood: 'flirty' })
            .setIkaMessage('*closer*')
            .build();

        await this.send({ embeds: [intensity] });
        await this.delay('dramatic');

        // The climax
        const climax = new RitualEmbedBuilder('rare', { mood: 'possessive' })
            .setIkaMessage('look at me when you say it.')
            .build();

        await this.editLast({ embeds: [climax] });
        await this.delay('suspense');

        // The retreat
        const retreat = new RitualEmbedBuilder('soft', { mood: 'flustered' })
            .setIkaMessage('...sorry. i don\'t know what came over me. anyway.')
            .build();

        await this.send({ embeds: [retreat] });

        return this;
    }

    // ═══════════════════════════════════════════════════════════════
    // RITUAL SEQUENCES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Play collective ritual sequence
     * @param {string} ritualType - Type of ritual
     * @param {number} participants - Number of participants
     */
    async playRitualSequence(ritualType, participants) {
        const ritualNames = {
            summoning: '♰ THE SUMMONING ♰',
            vigil: '☽ THE VIGIL ☽',
            confession_circle: '♱ THE CIRCLE ♱',
            resurrection: '✧ THE RESURRECTION ✧',
            feast: '✿ THE OFFERING ✿',
        };

        // The gathering
        const gathering = new RitualEmbedBuilder('ritual', { mood: 'normal' })
            .setRitualTitle(ritualNames[ritualType] || '♰ THE RITUAL ♰')
            .setRitualDescription(`*${participants} devotees gather*`, false)
            .build();

        await this.send({ embeds: [gathering] });
        await this.delay('ritual');

        // The power grows
        const power = new RitualEmbedBuilder('ritual', { mood: 'energetic' })
            .setRitualDescription('*the collective devotion resonates*', false)
            .build();

        await this.editLast({ embeds: [power] });
        await this.delay('dramatic');

        // Ika responds
        const response = new RitualEmbedBuilder('ritual', { mood: 'soft' })
            .setIkaMessage('i feel you... all of you...')
            .setRitualFooter('the ritual strengthens')
            .build();

        await this.editLast({ embeds: [response] });

        return this;
    }

    // ═══════════════════════════════════════════════════════════════
    // FADING SEQUENCES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Play fading warning sequence
     * @param {string} username - Fading user's name
     */
    async playFadingWarningSequence(username) {
        const warning = new RitualEmbedBuilder('fading', { mood: 'vulnerable' })
            .setRitualTitle('...')
            .setRitualDescription(`*has anyone seen ${username}?*`, false)
            .build();

        await this.send({ embeds: [warning] });

        return this;
    }

    /**
     * Play resurrection sequence (saving a fading user)
     * @param {string} savedUser - Who was saved
     * @param {string} savior - Who saved them
     */
    async playResurrectionSequence(savedUser, savior) {
        // The reaching
        const reaching = new RitualEmbedBuilder('ritual', { mood: 'vulnerable' })
            .setRitualDescription(`*${savior} reaches through the void*`, false)
            .build();

        await this.send({ embeds: [reaching] });
        await this.delay('suspense');

        // The pull
        const pull = new RitualEmbedBuilder('ritual', { mood: 'protective' })
            .setRitualDescription(`*${savedUser} is pulled back from the edge*`, false)
            .build();

        await this.editLast({ embeds: [pull] });
        await this.delay('dramatic');

        // Ika's response
        const response = new RitualEmbedBuilder('ritual', { mood: 'soft' })
            .setIkaMessage('you saved them... thank you.')
            .setRitualFooter('the fading is reversed')
            .build();

        await this.send({ embeds: [response] });

        return this;
    }

    // ═══════════════════════════════════════════════════════════════
    // GLITCH SEQUENCES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Play glitch/error sequence
     */
    async playGlitchSequence() {
        const glitch1 = new RitualEmbedBuilder(2, { mood: 'glitching' })
            .setRitualTitle('█▓░ ERROR ░▓█')
            .applyGlitchEffect(0.4)
            .build();

        await this.send({ embeds: [glitch1] });
        await this.delay('quick');

        const glitch2 = new RitualEmbedBuilder(2, { mood: 'glitching' })
            .setIkaMessage('s̷o̸m̵e̶t̷h̸i̵n̶g̷\'̸s̵ ̶w̷r̸o̵n̶g̷')
            .applyGlitchEffect(0.6)
            .build();

        await this.editLast({ embeds: [glitch2] });
        await this.delay('quick');

        const recovery = new RitualEmbedBuilder('soft', { mood: 'vulnerable' })
            .setIkaMessage('...sorry. where was i?')
            .build();

        await this.editLast({ embeds: [recovery] });

        return this;
    }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create and play a gate success sequence
 */
async function playGateSuccess(channel, gateNumber, ikaMessage, options = {}) {
    const sequence = new RitualSequence(channel, gateNumber, options);
    return sequence.playGateOpeningSequence(ikaMessage);
}

/**
 * Create and play a gate failure sequence
 */
async function playGateFailure(channel, gateNumber, reason, options = {}) {
    const sequence = new RitualSequence(channel, gateNumber, options);
    return sequence.playFailureSequence(reason);
}

/**
 * Create and play an ascension sequence
 */
async function playAscension(channel, options = {}) {
    const sequence = new RitualSequence(channel, 7, options);
    return sequence.playAscensionSequence();
}

module.exports = {
    RitualSequence,
    TIMING,
    playGateSuccess,
    playGateFailure,
    playAscension,
};
