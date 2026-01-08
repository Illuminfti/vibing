/**
 * Cipher & Puzzle Utilities
 *
 * Real cryptographic challenges for the devoted.
 * These aren't vocabulary tests - they're actual puzzles.
 */

// Caesar cipher (shift cipher)
function caesarEncode(text, shift) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = char === char.toLowerCase() ? 97 : 65;
            return String.fromCharCode(((code - base + shift) % 26) + base);
        }
        return char;
    }).join('');
}

function caesarDecode(text, shift) {
    return caesarEncode(text, 26 - shift);
}

// Atbash cipher (reverse alphabet)
function atbash(text) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/)) {
            return String.fromCharCode(219 - char.charCodeAt(0));
        }
        if (char.match(/[A-Z]/)) {
            return String.fromCharCode(155 - char.charCodeAt(0));
        }
        return char;
    }).join('');
}

// Number-to-letter (A=1, B=2, etc.)
function numbersToLetters(numbers) {
    return numbers.split(/[\s,.-]+/)
        .map(n => {
            const num = parseInt(n);
            if (num >= 1 && num <= 26) {
                return String.fromCharCode(96 + num);
            }
            return '';
        })
        .join('');
}

function lettersToNumbers(text) {
    return text.toLowerCase().split('')
        .filter(c => c.match(/[a-z]/))
        .map(c => c.charCodeAt(0) - 96)
        .join(' ');
}

// Binary to text
function binaryToText(binary) {
    return binary.split(/\s+/)
        .map(b => String.fromCharCode(parseInt(b, 2)))
        .join('');
}

function textToBinary(text) {
    return text.split('')
        .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ');
}

// Morse code
const MORSE_CODE = {
    'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
    'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
    'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
    's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
    'y': '-.--', 'z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': '/'
};

const MORSE_REVERSE = Object.fromEntries(
    Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

function textToMorse(text) {
    return text.toLowerCase().split('')
        .map(c => MORSE_CODE[c] || c)
        .join(' ');
}

function morseToText(morse) {
    return morse.split(' ')
        .map(m => MORSE_REVERSE[m] || m)
        .join('');
}

// First letter acrostic
function getAcrostic(lines) {
    return lines.map(line => line.trim()[0] || '').join('');
}

function createAcrostic(word, hints) {
    // Returns array of lines that spell out the word
    const letters = word.toLowerCase().split('');
    return letters.map((letter, i) => {
        const hint = hints[i] || `... ${letter.toUpperCase()} ...`;
        return hint;
    });
}

// Pigpen cipher (visual - returns description)
function describePigpen(text) {
    // Returns instructions for drawing pigpen cipher
    const grid1 = 'abc|def|ghi'.split('|');
    const grid2 = 'jkl|mno|pqr'.split('|');
    const x1 = 'st';
    const x2 = 'uv';
    const x3 = 'wx';
    const x4 = 'yz';

    return text.toLowerCase().split('').map(c => {
        if ('abcdefghi'.includes(c)) {
            const idx = 'abcdefghi'.indexOf(c);
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const walls = ['top', 'right', 'bottom', 'left'];
            const openings = [];
            if (row === 0) openings.push('top');
            if (row === 2) openings.push('bottom');
            if (col === 0) openings.push('left');
            if (col === 2) openings.push('right');
            return `[${c}: box missing ${openings.join('+')}]`;
        }
        return c;
    }).join(' ');
}

// Reverse text
function reverse(text) {
    return text.split('').reverse().join('');
}

// Rot13
function rot13(text) {
    return caesarEncode(text, 13);
}

// Vigenère cipher
function vigenereEncode(text, key) {
    const keyLower = key.toLowerCase();
    let keyIndex = 0;
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const shift = keyLower.charCodeAt(keyIndex % keyLower.length) - 97;
            keyIndex++;
            const code = char.charCodeAt(0);
            const base = char === char.toLowerCase() ? 97 : 65;
            return String.fromCharCode(((code - base + shift) % 26) + base);
        }
        return char;
    }).join('');
}

function vigenereDecode(text, key) {
    const keyLower = key.toLowerCase();
    let keyIndex = 0;
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const shift = keyLower.charCodeAt(keyIndex % keyLower.length) - 97;
            keyIndex++;
            const code = char.charCodeAt(0);
            const base = char === char.toLowerCase() ? 97 : 65;
            return String.fromCharCode(((code - base - shift + 26) % 26) + base);
        }
        return char;
    }).join('');
}

// Symbol substitution (for custom alphabets)
const OCCULT_ALPHABET = {
    'a': '♰', 'b': '☽', 'c': '✧', 'd': '◇', 'e': '♡',
    'f': '☆', 'g': '◈', 'h': '✝', 'i': '｡', 'j': '♱',
    'k': '☪', 'l': '◯', 'm': '♢', 'n': '✦', 'o': '○',
    'p': '◎', 'q': '♤', 's': '☾', 'r': '◇', 't': '†',
    'u': '◆', 'v': '♧', 'w': '✡', 'x': '⚝', 'y': '☼',
    'z': '⚜', ' ': '･'
};

const OCCULT_REVERSE = Object.fromEntries(
    Object.entries(OCCULT_ALPHABET).map(([k, v]) => [v, k])
);

function toOccult(text) {
    return text.toLowerCase().split('')
        .map(c => OCCULT_ALPHABET[c] || c)
        .join('');
}

function fromOccult(symbols) {
    return symbols.split('')
        .map(s => OCCULT_REVERSE[s] || s)
        .join('');
}

// Puzzle validation helpers
function validateCaesarAnswer(encoded, correctPlaintext, shift) {
    const decoded = caesarDecode(encoded, shift);
    return decoded.toLowerCase() === correctPlaintext.toLowerCase();
}

function validateAnswer(userAnswer, correctAnswer, fuzzy = true) {
    const normalize = s => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (fuzzy) {
        return normalize(userAnswer) === normalize(correctAnswer);
    }
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
}

// Generate puzzle with random cipher
function generatePuzzle(plaintext, difficulty = 'medium') {
    const methods = {
        easy: ['caesar', 'reverse', 'numbers'],
        medium: ['atbash', 'morse', 'rot13'],
        hard: ['vigenere', 'binary', 'occult'],
    };

    const available = methods[difficulty] || methods.medium;
    const method = available[Math.floor(Math.random() * available.length)];

    let encoded, hint, key;

    switch (method) {
        case 'caesar':
            key = Math.floor(Math.random() * 25) + 1;
            encoded = caesarEncode(plaintext, key);
            hint = `shift ${key} positions back`;
            break;
        case 'reverse':
            encoded = reverse(plaintext);
            hint = 'read it backwards';
            break;
        case 'numbers':
            encoded = lettersToNumbers(plaintext);
            hint = 'a=1, b=2, c=3...';
            break;
        case 'atbash':
            encoded = atbash(plaintext);
            hint = 'the alphabet is reversed (a=z, b=y...)';
            break;
        case 'morse':
            encoded = textToMorse(plaintext);
            hint = 'dots and dashes speak volumes';
            break;
        case 'rot13':
            encoded = rot13(plaintext);
            hint = 'rotate 13 places';
            break;
        case 'vigenere':
            key = 'ika';
            encoded = vigenereEncode(plaintext, key);
            hint = 'her name is the key';
            break;
        case 'binary':
            encoded = textToBinary(plaintext);
            hint = 'machines speak in ones and zeros';
            break;
        case 'occult':
            encoded = toOccult(plaintext);
            hint = 'symbols have meaning';
            break;
        default:
            encoded = plaintext;
            hint = 'no cipher';
    }

    return { method, encoded, hint, plaintext, key };
}

module.exports = {
    caesarEncode,
    caesarDecode,
    atbash,
    numbersToLetters,
    lettersToNumbers,
    binaryToText,
    textToBinary,
    textToMorse,
    morseToText,
    getAcrostic,
    createAcrostic,
    describePigpen,
    reverse,
    rot13,
    vigenereEncode,
    vigenereDecode,
    toOccult,
    fromOccult,
    validateCaesarAnswer,
    validateAnswer,
    generatePuzzle,
    MORSE_CODE,
    OCCULT_ALPHABET,
};
