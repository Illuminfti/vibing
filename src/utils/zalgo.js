// Zalgo text generator for glitch effects
// Creates that creepy l̷i̵k̶e̷ ̸t̵h̶i̷s̸ effect

// Combining characters for zalgo effect
const zalgoUp = [
    '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306',
    '\u0310', '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a',
    '\u0342', '\u0343', '\u0344', '\u034a', '\u034b', '\u034c', '\u0303',
    '\u0302', '\u030c', '\u0350', '\u0300', '\u0301', '\u030b', '\u030f',
    '\u0312', '\u0313', '\u0314', '\u033d', '\u0309', '\u0363', '\u0364',
    '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036a', '\u036b',
    '\u036c', '\u036d', '\u036e', '\u036f', '\u033e', '\u035b',
];

const zalgoMiddle = [
    '\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322',
    '\u0327', '\u0328', '\u0334', '\u0335', '\u0336', '\u034f', '\u035c',
    '\u035d', '\u035e', '\u035f', '\u0360', '\u0362', '\u0338', '\u0337',
    '\u0361', '\u0489',
];

const zalgoDown = [
    '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e',
    '\u031f', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a',
    '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331',
    '\u0332', '\u0333', '\u0339', '\u033a', '\u033b', '\u033c', '\u0345',
    '\u0347', '\u0348', '\u0349', '\u034d', '\u034e', '\u0353', '\u0354',
    '\u0355', '\u0356', '\u0359', '\u035a', '\u0323',
];

/**
 * Get random item from array
 */
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Add zalgo characters to a single character
 */
function zalgoChar(char, intensity = 'medium') {
    // Skip spaces and newlines
    if (char === ' ' || char === '\n') return char;

    const intensityMap = {
        low: { up: 1, mid: 0, down: 1 },
        medium: { up: 2, mid: 1, down: 2 },
        high: { up: 4, mid: 2, down: 4 },
        extreme: { up: 8, mid: 3, down: 8 },
    };

    const config = intensityMap[intensity] || intensityMap.medium;

    let result = char;

    // Add random number of combining characters
    for (let i = 0; i < Math.random() * config.up; i++) {
        result += randomFrom(zalgoUp);
    }
    for (let i = 0; i < Math.random() * config.mid; i++) {
        result += randomFrom(zalgoMiddle);
    }
    for (let i = 0; i < Math.random() * config.down; i++) {
        result += randomFrom(zalgoDown);
    }

    return result;
}

/**
 * Apply zalgo effect to entire text
 */
function glitchText(text, intensity = 'medium') {
    return text.split('').map(char => zalgoChar(char, intensity)).join('');
}

/**
 * Apply zalgo to a single word
 */
function glitchWord(word, intensity = 'medium') {
    return glitchText(word, intensity);
}

/**
 * Randomly glitch some words in text
 */
function partialGlitch(text, probability = 0.2, intensity = 'low') {
    return text.split(' ').map(word => {
        if (Math.random() < probability) {
            return glitchText(word, intensity);
        }
        return word;
    }).join(' ');
}

/**
 * Check if we should apply glitch (5% chance by default)
 */
function shouldGlitch(probability = 0.05) {
    return Math.random() < probability;
}

/**
 * Maybe glitch text based on probability
 */
function maybeGlitch(text, probability = 0.05, intensity = 'low') {
    if (shouldGlitch(probability)) {
        return partialGlitch(text, 0.3, intensity);
    }
    return text;
}

/**
 * Create a glitchy version of a name/word for dramatic effect
 */
function dramaticGlitch(text) {
    // Glitch more at the end for a "fading" effect
    const chars = text.split('');
    return chars.map((char, i) => {
        const progress = i / chars.length;
        if (progress > 0.7 && Math.random() > 0.3) {
            return zalgoChar(char, 'high');
        } else if (progress > 0.5 && Math.random() > 0.5) {
            return zalgoChar(char, 'medium');
        } else if (Math.random() > 0.8) {
            return zalgoChar(char, 'low');
        }
        return char;
    }).join('');
}

module.exports = {
    glitchText,
    glitchWord,
    partialGlitch,
    shouldGlitch,
    maybeGlitch,
    dramaticGlitch,
};
