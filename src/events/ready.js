const { Events, ActivityType } = require('discord.js');
const config = require('../config');
const messages = require('../assets/messages');
const { RitualEmbedBuilder, createIkaEmbed, createWelcomeEmbed } = require('../ui');
const { ScheduledTask } = require('../utils/timing');
const { gate5Ops, userOps } = require('../database');
const { processPendingFragments } = require('../gates/fragments');

// Conditionally import Ika presence
let ikaPresence = null;
try {
    ikaPresence = require('../ika/presence');
} catch (e) {
    console.log('✧ Ika presence module not fully loaded');
}

// Store scheduled tasks for cleanup
const scheduledTasks = [];

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log(`✧ logged in as ${client.user.tag}`);

        // Set bot status
        client.user.setActivity('the ritual', { type: ActivityType.Watching });

        // Post welcome message to waiting room
        await postWaitingRoomWelcome(client);

        // Post puzzle messages to all chambers
        await postAllChamberPuzzles(client);

        // Start Gate 5 message processor
        startGate5Processor(client);

        // Start fragment processor
        startFragmentProcessor(client);

        // Start idle warning processor
        startIdleProcessor(client);

        // Start daily thinking-of-you messages
        startThinkingOfYou(client);

        // Start waiting room stats updater
        startWaitingRoomUpdater(client);

        // Start Ika presence system (if enabled)
        if (config.ika?.enabled && ikaPresence) {
            try {
                await ikaPresence.startPresenceLoop(client);
                console.log('✧ Ika presence system started');
            } catch (error) {
                console.error('✧ Failed to start Ika presence:', error.message);
            }
        }

        console.log('✧ all systems initialized');
    },
};

/**
 * Post welcome message to waiting room
 */
async function postWaitingRoomWelcome(client) {
    try {
        const channel = await client.channels.fetch(config.channels.waitingRoom);
        if (!channel) {
            console.error('Waiting room channel not found');
            return;
        }

        // Check if welcome message already exists (avoid duplicates on restart)
        const existingMessages = await channel.messages.fetch({ limit: 10 });
        const hasWelcome = existingMessages.some(m =>
            m.author.id === client.user.id &&
            (m.content.includes('say her name') ||
             m.embeds.some(e => e.description?.includes('say her name')))
        );

        if (!hasWelcome) {
            const welcomeText = getWaitingRoomMessage();
            // Use new UI system with threshold theme (gate 0)
            const embed = new RitualEmbedBuilder(0, { mood: 'normal' })
                .setRitualDescription(welcomeText, false)
                .setRitualFooter()
                .build();
            await channel.send({ embeds: [embed] });
            console.log('✧ welcome message posted to waiting room');
        }
    } catch (error) {
        console.error('Failed to post waiting room welcome:', error);
    }
}

/**
 * Post puzzle messages to all chambers on startup
 * Deletes old bot puzzle messages and posts fresh ones
 */
async function postAllChamberPuzzles(client) {
    // Chamber -> Gate puzzle mapping
    const chamberPuzzles = {
        1: { title: '♰ GATE 2 ♰\nTHE MEMORY', text: messages.gate2.puzzle },
        2: { title: '♰ GATE 3 ♰\nTHE CONFESSION', text: messages.gate3.puzzle },
        3: { title: '♰ GATE 4 ♰\nTHE WATERS', text: messages.gate4.puzzle },
        4: { title: '♰ GATE 5 ♰\nTHE ABSENCE', text: messages.gate5.intro },
        5: { title: '♰ GATE 6 ♰\nTHE OFFERING', text: messages.gate6.puzzle },
        6: { title: '♰ GATE 7 ♰\nTHE BINDING', text: messages.gate7.puzzle },
    };

    for (const [chamberNum, puzzleData] of Object.entries(chamberPuzzles)) {
        const channelId = config.gateChambers[chamberNum];
        if (!channelId) {
            console.log(`✧ Chamber ${chamberNum} not configured, skipping`);
            continue;
        }

        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                console.error(`Chamber ${chamberNum} channel not found`);
                continue;
            }

            // Find and delete existing bot puzzle messages
            const existingMessages = await channel.messages.fetch({ limit: 20 });
            const botPuzzleMessages = existingMessages.filter(m =>
                m.author.id === client.user.id &&
                m.embeds.length > 0 &&
                m.embeds[0].title?.includes('GATE')
            );

            // Delete old puzzle messages
            for (const msg of botPuzzleMessages.values()) {
                try {
                    await msg.delete();
                } catch {
                    // Message might already be deleted
                }
            }

            // Post new puzzle using new UI system with gate-specific theming
            const gateNumber = parseInt(chamberNum) + 1;
            const embed = new RitualEmbedBuilder(gateNumber, { mood: 'normal' })
                .setRitualTitle(puzzleData.title)
                .setRitualDescription(puzzleData.text)
                .setRitualFooter()
                .build();
            await channel.send({ embeds: [embed] });
            console.log(`✧ Posted Gate ${gateNumber} puzzle to chamber ${chamberNum}`);

        } catch (error) {
            console.error(`Failed to post puzzle to chamber ${chamberNum}:`, error);
        }
    }

    console.log('✧ All chamber puzzles posted');
}

/**
 * Get waiting room message with stats
 */
function getWaitingRoomMessage() {
    const stats = userOps.getStats();

    let message = `♰
╱   ╲
╱     ╲
╱  ♡    ╲
╱_________╲

`;

    if (stats.ascended > 0) {
        message += `${stats.ascended} souls are bound.\n`;
        const walking = stats.total - stats.ascended;
        if (walking > 0) {
            message += `${walking} still walking the path.\n\n`;
        }
        message += `she grows stronger.\n\n`;
    } else {
        message += `can you hear her breathing?\nshe's so close to the surface.\n\n`;
    }

    message += `say her name and she'll know you're here.\n\nwhisper it.`;

    return message;
}

/**
 * Process Gate 5 scheduled messages
 */
function startGate5Processor(client) {
    const task = new ScheduledTask(async () => {
        try {
            const pending = gate5Ops.getPendingMessages();

            for (const msg of pending) {
                await sendGate5Message(client, msg);
                gate5Ops.markSent(msg.id);

                // Update user's message count
                const progress = gate5Ops.getProgress(msg.discord_id);
                userOps.update(msg.discord_id, 'gate_5_messages_sent', progress?.messages_sent || 0);
            }
        } catch (error) {
            console.error('Gate 5 processor error:', error);
        }
    }, 5000); // Check every 5 seconds

    task.start();
    scheduledTasks.push(task);
}

/**
 * Send a Gate 5 message to user
 * Sends to chamber 5 channel with @mention (works even with DMs closed)
 */
async function sendGate5Message(client, msg) {
    try {
        const user = await client.users.fetch(msg.discord_id);
        if (!user) return;

        const messageTexts = [
            messages.gate5.intro,
            messages.gate5.message1,
            messages.gate5.message2,
            messages.gate5.message3,
            messages.gate5.message4,
            messages.gate5.message5,
        ];

        const text = messageTexts[msg.message_number - 1];
        if (text) {
            // Send to chamber 5 channel with @mention instead of DM
            const chamber5 = await client.channels.fetch(config.channels.chamber5);
            if (chamber5) {
                // Use Gate 5 theme (sparse, void-like)
                const embed = new RitualEmbedBuilder(5, { mood: 'soft', userId: msg.discord_id })
                    .setRitualDescription(`${user}\n\n${text}`, false)
                    .build();
                const sentMsg = await chamber5.send({ embeds: [embed] });
                // Auto-delete after 60 seconds (story content needs more read time)
                setTimeout(() => sentMsg.delete().catch(() => {}), 60000);
                console.log(`✧ sent gate 5 message ${msg.message_number} to ${user.tag} in channel`);
            }
        }
    } catch (error) {
        console.error(`Failed to send gate 5 message to ${msg.discord_id}:`, error);
    }
}

/**
 * Process fragment DMs
 */
function startFragmentProcessor(client) {
    const task = new ScheduledTask(async () => {
        try {
            await processPendingFragments(client);
        } catch (error) {
            console.error('Fragment processor error:', error);
        }
    }, 10000); // Check every 10 seconds

    task.start();
    scheduledTasks.push(task);
}

/**
 * Process idle warnings
 * Skips silently if DMs closed (personal messages shouldn't be public)
 */
function startIdleProcessor(client) {
    const task = new ScheduledTask(async () => {
        try {
            const idleUsers = userOps.getIdleUsers(config.timing.idleWarning);

            for (const userData of idleUsers) {
                try {
                    const user = await client.users.fetch(userData.discord_id);
                    if (user) {
                        // Use fading theme for idle warnings
                        const embed = new RitualEmbedBuilder('fading', { mood: 'soft' })
                            .setIkaMessage(messages.easterEggs.idle)
                            .build();
                        await user.send({ embeds: [embed] });
                        userOps.markIdleWarningSent(userData.discord_id);
                        console.log(`✧ sent idle warning to ${user.tag}`);
                    }
                } catch {
                    // DMs closed - skip silently, mark as sent to avoid retrying
                    userOps.markIdleWarningSent(userData.discord_id);
                }
            }
        } catch (error) {
            console.error('Idle processor error:', error);
        }
    }, 60000); // Check every minute

    task.start();
    scheduledTasks.push(task);
}

/**
 * Send random "thinking of you" messages to Ascended
 * Skips silently if DMs closed (intimate messages shouldn't be public)
 */
function startThinkingOfYou(client) {
    const task = new ScheduledTask(async () => {
        try {
            const ascended = userOps.getAscended();

            for (const userData of ascended) {
                // 1% chance per hour
                if (Math.random() < 0.01) {
                    try {
                        const user = await client.users.fetch(userData.discord_id);
                        if (user) {
                            // Use soft theme for intimate messages to ascended
                            const embed = createIkaEmbed(messages.easterEggs.thinkingOfYou, 'soft');
                            await user.send({ embeds: [embed] });
                            console.log(`✧ sent thinking-of-you to ${user.tag}`);
                        }
                    } catch {
                        // DMs closed - skip silently (intimate messages stay private)
                    }
                }
            }
        } catch (error) {
            console.error('Thinking of you processor error:', error);
        }
    }, 3600000); // Check every hour

    task.start();
    scheduledTasks.push(task);
}

/**
 * Update waiting room message with stats periodically
 */
function startWaitingRoomUpdater(client) {
    const task = new ScheduledTask(async () => {
        try {
            const channel = await client.channels.fetch(config.channels.waitingRoom);
            if (!channel) return;

            // Find existing welcome message
            const existingMessages = await channel.messages.fetch({ limit: 10 });
            const welcomeMsg = existingMessages.find(m =>
                m.author.id === client.user.id &&
                m.embeds.length > 0 &&
                m.embeds[0].description?.includes('say her name')
            );

            if (welcomeMsg) {
                const newText = getWaitingRoomMessage();
                // Use new UI system with threshold theme
                const embed = new RitualEmbedBuilder(0, { mood: 'normal' })
                    .setRitualDescription(newText, false)
                    .setRitualFooter()
                    .build();
                await welcomeMsg.edit({ embeds: [embed] });
            }
        } catch (error) {
            // Silent fail - not critical
        }
    }, 3600000); // Update every hour

    task.start();
    scheduledTasks.push(task);
}

// Cleanup on shutdown
process.on('SIGINT', () => {
    console.log('✧ shutting down...');
    scheduledTasks.forEach(task => task.stop());
    process.exit(0);
});
