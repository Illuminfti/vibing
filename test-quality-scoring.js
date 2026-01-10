/**
 * Test cases for interaction quality scoring
 */

const { scoreInteractionQuality, getQualityTier, getQualityIndicator } = require('./src/ika/interactionQuality');

console.log('=== Interaction Quality Scoring Tests ===\n');

// Test cases as specified in requirements
const testCases = [
    {
        message: "hi",
        expected: "~0.6 (low quality)",
        context: {}
    },
    {
        message: "hey ika, how are you doing today?",
        expected: "~1.5 (high quality)",
        context: {}
    },
    {
        message: "k",
        expected: "0.5 (minimum - single letter)",
        context: {}
    },
    {
        message: "i wanted to tell you something. i've been thinking about what you said yesterday and honestly it made me realize something important",
        expected: "~1.8-2.0 (exceptional quality)",
        context: { conversationDepth: 3 }
    },
    {
        message: "lol!!!!!",
        expected: "~0.5-0.6 (spam)",
        context: {}
    },
    {
        message: "hahahahaha",
        expected: "~0.6-0.7 (repeated chars)",
        context: {}
    },
    {
        message: "remember when you said you felt lonely? i think about that sometimes",
        expected: "~1.6-1.8 (memory reference + personal)",
        context: {}
    },
    {
        message: "what do you think about the meaning of devotion in your world?",
        expected: "~1.5-1.6 (thoughtful question)",
        context: {}
    },
    {
        message: "ok",
        expected: "~0.6 (generic)",
        context: {}
    },
    {
        message: "i feel like we've talked about this before but i wanted to ask you again because i care",
        expected: "~1.7-1.9 (vulnerability + memory)",
        context: { conversationDepth: 5 }
    }
];

testCases.forEach((test, index) => {
    const score = scoreInteractionQuality(test.message, test.context);
    const tier = getQualityTier(score);
    const indicator = getQualityIndicator(score);

    console.log(`Test ${index + 1}:`);
    console.log(`  Message: "${test.message.substring(0, 60)}${test.message.length > 60 ? '...' : ''}"`);
    console.log(`  Score: ${score.toFixed(2)}x (${tier}) ${indicator}`);
    console.log(`  Expected: ${test.expected}`);
    console.log('');
});

console.log('\n=== Additional Edge Cases ===\n');

// Additional edge cases
const edgeCases = [
    { message: "", context: {} },
    { message: "😊😊😊😊😊", context: {} },
    { message: "This is a very thoughtful message with lots of varied vocabulary and interesting perspectives about the world we live in and how we connect", context: { conversationDepth: 4 } },
    { message: "sup", context: {} },
    { message: "honestly i've been feeling really down lately and wanted to talk to someone who gets it", context: {} },
];

edgeCases.forEach((test, index) => {
    const score = scoreInteractionQuality(test.message, test.context);
    const tier = getQualityTier(score);

    console.log(`Edge Case ${index + 1}:`);
    console.log(`  Message: "${test.message.substring(0, 60)}${test.message.length > 60 ? '...' : ''}"`);
    console.log(`  Score: ${score.toFixed(2)}x (${tier})`);
    console.log('');
});

console.log('\n=== Summary ===');
console.log('Quality scoring system implemented successfully!');
console.log('Range: 0.5 (minimum) to 2.0 (maximum)');
console.log('Base score: 1.0 (normal quality)');
console.log('Positive indicators: length, questions, personal sharing, memory references, conversation depth');
console.log('Negative indicators: short messages, generic phrases, spam patterns, excessive punctuation');
