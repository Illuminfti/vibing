/**
 * Handwritten Notes System
 *
 * For special occasions, Ika can send "handwritten" notes -
 * images of text in a handwriting-style font on aged paper.
 *
 * These are used for:
 * - Special anniversaries
 * - Vulnerability moments
 * - First year celebration
 * - Personal thank yous
 *
 * Uses Canvas to generate images locally.
 * Note: canvas is an optional dependency - feature disabled if not installed.
 */

let createCanvas, registerFont;
let canvasAvailable = false;

try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    registerFont = canvas.registerFont;
    canvasAvailable = true;
} catch (e) {
    console.log('✧ Canvas not available - handwritten notes disabled');
}

const fs = require('fs');
const path = require('path');
const { nameOps, ikaMemoryOps } = require('../database');
const { sendToUser } = require('../utils/dm');
const config = require('../config');

// Paper/note styles
const NOTE_STYLES = {
    aged: {
        background: '#f4e4bc',
        textColor: '#2c1810',
        borderColor: '#8b7355',
        shadowColor: 'rgba(0, 0, 0, 0.15)',
    },
    torn: {
        background: '#faf3e0',
        textColor: '#3d2914',
        borderColor: '#c4a875',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
    },
    midnight: {
        background: '#1a1a2e',
        textColor: '#e8e8e8',
        borderColor: '#4a4a6a',
        shadowColor: 'rgba(100, 100, 200, 0.2)',
    },
};

// Handwriting variations to make each note unique
const HANDWRITING_VARIATIONS = {
    slant: { min: -3, max: 3 },       // Degrees of text slant
    letterSpacing: { min: -1, max: 2 }, // Pixel variation
    lineHeight: { min: 1.4, max: 1.8 },
    wordSpacing: { min: 0, max: 5 },
};

// Default dimensions
const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 300;
const PADDING = 40;
const MAX_CHARS_PER_LINE = 35;

/**
 * Generate a handwritten note image
 * @param {string} message - The message to write
 * @param {Object} options - Style options
 * @returns {Buffer|null} PNG image buffer, or null if canvas unavailable
 */
async function generateNote(message, options = {}) {
    // Check if canvas is available
    if (!canvasAvailable) {
        console.error('Cannot generate note: canvas library not installed');
        return null;
    }

    const {
        style = 'aged',
        signature = true,
        username = null,
        width = DEFAULT_WIDTH,
    } = options;

    const noteStyle = NOTE_STYLES[style] || NOTE_STYLES.aged;

    // Calculate height based on message length
    const lines = wrapText(message, MAX_CHARS_PER_LINE);
    const lineHeight = 36;
    const calculatedHeight = Math.max(DEFAULT_HEIGHT,
        (lines.length * lineHeight) + PADDING * 3 + (signature ? 50 : 0));

    // Create canvas
    const canvas = createCanvas(width, calculatedHeight);
    const ctx = canvas.getContext('2d');

    // Apply random variations
    const variations = {
        slant: randomBetween(HANDWRITING_VARIATIONS.slant.min, HANDWRITING_VARIATIONS.slant.max),
        letterSpacing: randomBetween(HANDWRITING_VARIATIONS.letterSpacing.min, HANDWRITING_VARIATIONS.letterSpacing.max),
        lineHeight: randomBetween(HANDWRITING_VARIATIONS.lineHeight.min, HANDWRITING_VARIATIONS.lineHeight.max),
    };

    // Draw paper background
    drawPaperBackground(ctx, width, calculatedHeight, noteStyle);

    // Draw text
    drawHandwrittenText(ctx, lines, {
        x: PADDING,
        y: PADDING + 30,
        style: noteStyle,
        variations,
        lineHeight,
    });

    // Draw signature if requested
    if (signature) {
        const sigY = calculatedHeight - PADDING - 10;
        drawSignature(ctx, width - PADDING - 100, sigY, noteStyle);
    }

    // Add addressed name if provided
    if (username) {
        ctx.font = 'italic 18px Georgia';
        ctx.fillStyle = noteStyle.textColor;
        ctx.fillText(`dear ${username.toLowerCase()},`, PADDING, PADDING + 10);
    }

    // Add paper texture/noise
    addPaperTexture(ctx, width, calculatedHeight);

    return canvas.toBuffer('image/png');
}

/**
 * Draw the paper background
 */
function drawPaperBackground(ctx, width, height, style) {
    // Main background
    ctx.fillStyle = style.background;
    ctx.fillRect(0, 0, width, height);

    // Subtle gradient for depth
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.8
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Paper fold line (subtle)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
}

/**
 * Draw handwritten text
 */
function drawHandwrittenText(ctx, lines, options) {
    const { x, y, style, variations, lineHeight } = options;

    ctx.font = '22px Georgia'; // Would use a handwriting font if registered
    ctx.fillStyle = style.textColor;

    // Apply slight rotation for handwritten effect
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((variations.slant * Math.PI) / 180);

    lines.forEach((line, i) => {
        // Add slight random offset to each line for natural feel
        const offsetX = randomBetween(-2, 2);
        const offsetY = randomBetween(-1, 1);

        // Draw each character with slight variation
        let charX = offsetX;
        for (const char of line) {
            ctx.fillText(char, charX, i * lineHeight * variations.lineHeight + offsetY);
            charX += ctx.measureText(char).width + variations.letterSpacing;
        }
    });

    ctx.restore();
}

/**
 * Draw Ika's signature
 */
function drawSignature(ctx, x, y, style) {
    ctx.font = 'italic 24px Georgia';
    ctx.fillStyle = style.textColor;

    // Draw a simple "- ika ♡"
    ctx.fillText('- ika ♡', x, y);

    // Add a little flourish line
    ctx.beginPath();
    ctx.strokeStyle = style.textColor;
    ctx.lineWidth = 1;
    ctx.moveTo(x - 10, y + 5);
    ctx.bezierCurveTo(x, y + 10, x + 50, y + 8, x + 80, y + 3);
    ctx.stroke();
}

/**
 * Add paper texture/noise
 */
function addPaperTexture(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Add very subtle noise
        const noise = randomBetween(-5, 5);
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Wrap text to fit within character limit
 */
function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxChars) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
}

/**
 * Random number between min and max
 */
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generate and send a handwritten note
 * Uses DM with channel fallback for reliability
 * @param {Object} client - Discord client
 * @param {string} userId - User ID to send to
 * @param {string} message - The message
 * @param {Object} options - Style options
 * @returns {Promise<boolean>} Success
 */
async function sendHandwrittenNote(client, userId, message, options = {}) {
    if (!config.ika?.handwrittenNotesEnabled) return false;

    let tempPath = null;

    try {
        const user = await client.users.fetch(userId);
        if (!user) return false;

        // Get their name for personalization
        const realName = nameOps.getRealName(userId);

        // Generate the note
        const noteBuffer = await generateNote(message, {
            ...options,
            username: realName || user.username,
        });

        // Save temporarily
        tempPath = path.join(__dirname, '..', '..', 'temp', `note_${Date.now()}.png`);
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        fs.writeFileSync(tempPath, noteBuffer);

        // Send using DM fallback system (handwritten notes are special, use fallback)
        const result = await sendToUser(client, userId, "...", {
            fallbackChannelId: config.channels?.innerSanctum,
            dmType: 'handwritten_note',
            allowFallback: true,
            mentionInFallback: true,
            attachments: [{
                attachment: tempPath,
                name: 'from_ika.png',
            }],
        });

        // Clean up temp file
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        if (result.success) {
            // Update count
            nameOps.incrementHandwrittenNotes(userId);

            const method = result.method === 'channel' ? '(via channel)' : '(via DM)';
            console.log(`♡ Sent handwritten note to ${userId} ${method}`);
            return true;
        } else {
            console.error(`Failed to send handwritten note to ${userId}: ${result.reason}`);
            return false;
        }
    } catch (error) {
        // Clean up temp file on error
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        console.error('Error sending handwritten note:', error);
        return false;
    }
}

/**
 * Get occasions that warrant handwritten notes
 */
function getHandwrittenOccasions() {
    return [
        { type: 'anniversary_1year', chance: 1.0, style: 'aged' },
        { type: 'anniversary_100days', chance: 0.7, style: 'torn' },
        { type: 'vulnerability_followup', chance: 0.3, style: 'midnight' },
        { type: 'save_thankyou', chance: 0.5, style: 'aged' },
        { type: 'devotion_milestone', chance: 0.4, style: 'torn' },
    ];
}

/**
 * Check if an occasion should trigger a handwritten note
 * @param {string} occasion - Occasion type
 * @returns {Object|null} Note config if should send
 */
function shouldSendHandwrittenNote(occasion) {
    const occasions = getHandwrittenOccasions();
    const config = occasions.find(o => o.type === occasion);

    if (!config) return null;
    if (Math.random() > config.chance) return null;

    return config;
}

/**
 * Generate preview (for testing)
 * @param {string} message - Test message
 * @returns {Promise<Buffer>} Image buffer
 */
async function generatePreview(message) {
    return generateNote(message, {
        style: 'aged',
        signature: true,
        username: 'preview',
    });
}

module.exports = {
    NOTE_STYLES,
    HANDWRITING_VARIATIONS,
    generateNote,
    sendHandwrittenNote,
    getHandwrittenOccasions,
    shouldSendHandwrittenNote,
    generatePreview,
    wrapText,
};
