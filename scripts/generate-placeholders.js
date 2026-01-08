/**
 * Generate placeholder images for the Seven Gates bot
 *
 * This script creates simple placeholder PNG images until real art is ready.
 * Run with: node scripts/generate-placeholders.js
 *
 * Requires: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const images = [
    { name: 'gate1_eyes.png', text: 'GATE 1\n\neyes glowing\nin darkness' },
    { name: 'gate2_lips.png', text: 'GATE 2\n\nlips parting\nto speak' },
    { name: 'gate3_silhouette.png', text: 'GATE 3\n\na figure\nin shadow' },
    { name: 'gate4_water.png', text: 'GATE 4\n\nripples\nin deep water' },
    { name: 'gate5_awake.png', text: 'GATE 5\n\neyes opening\nslowly' },
    { name: 'gate6_intimate.png', text: 'GATE 6\n\na hand\nreaching' },
    { name: 'gate7_reaching.png', text: 'GATE 7\n\nfull form\nemerging' },
];

async function generatePlaceholders() {
    const imagesDir = path.join(__dirname, '..', 'images');

    // Ensure directory exists
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    for (const img of images) {
        const canvas = createCanvas(400, 400);
        const ctx = canvas.getContext('2d');

        // Black background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 400, 400);

        // Pink border
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 380, 380);

        // Occult symbol at top
        ctx.fillStyle = '#ff69b4';
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.fillText('♰', 200, 60);

        // Main text
        ctx.fillStyle = '#ff69b4';
        ctx.font = '24px monospace';

        const lines = img.text.split('\n');
        let y = 150;
        for (const line of lines) {
            ctx.fillText(line, 200, y);
            y += 35;
        }

        // Bottom symbol
        ctx.fillText('♡', 200, 360);

        // Save
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(path.join(imagesDir, img.name), buffer);
        console.log(`✧ created ${img.name}`);
    }

    console.log('\n✧ all placeholder images generated');
}

// Check if canvas is available
try {
    require('canvas');
    generatePlaceholders();
} catch (e) {
    console.log('Canvas not installed. Creating empty placeholder files.');
    console.log('To generate real placeholders, run: npm install canvas');

    const imagesDir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Create .gitkeep
    fs.writeFileSync(path.join(imagesDir, '.gitkeep'), '');
    console.log('✧ created images/.gitkeep');
}
