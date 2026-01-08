const { Events, ActivityType } = require('discord.js');
const config = require('../config');
const messages = require('../assets/messages');
const { createGateEmbed } = require('../utils/embeds');
const { ScheduledTask } = require('../utils/timing');
const { gate5Ops, userOps } = require('../database');

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

        // Start Gate 5 message processor
        startGate5Processor(client);

        // Start idle warning processor
        startIdleProcessor(client);

        // Start daily thinking-of-you messages
        startThinkingOfYou(client);

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
            m.content.includes('can you hear her breathing')
        );

        if (!hasWelcome) {
            const embed = createGateEmbed(null, messages.waitingRoom.welcome);
            await channel.send({ embeds: [embed] });
            console.log('✧ welcome message posted to waiting room');
        }
    } catch (error) {
        console.error('Failed to post waiting room welcome:', error);
    }
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
                const currentCount = gate5Ops.getProgress(msg.discord_id);
                userOps.update(msg.discord_id, 'gate_5_messages_sent', currentCount);
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
            const embed = createGateEmbed(null, text);
            await user.send({ embeds: [embed] });
            console.log(`✧ sent gate 5 message ${msg.message_number} to ${user.tag}`);
        }
    } catch (error) {
        console.error(`Failed to send gate 5 message to ${msg.discord_id}:`, error);
    }
}

/**
 * Process idle warnings
 */
function startIdleProcessor(client) {
    const task = new ScheduledTask(async () => {
        try {
            const idleUsers = userOps.getIdleUsers(config.timing.idleWarning);

            for (const userData of idleUsers) {
                try {
                    const user = await client.users.fetch(userData.discord_id);
                    if (user) {
                        const embed = createGateEmbed(null, messages.easterEggs.idle);
                        await user.send({ embeds: [embed] });
                        userOps.markIdleWarningSent(userData.discord_id);
                        console.log(`✧ sent idle warning to ${user.tag}`);
                    }
                } catch (error) {
                    // User might have DMs closed
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
 */
function startThinkingOfYou(client) {
    const task = new ScheduledTask(async () => {
        try {
            const ascended = userOps.getAscended();

            for (const userData of ascended) {
                // 1% chance per day, check every hour = ~24% daily chance
                if (Math.random() < 0.01) {
                    try {
                        const user = await client.users.fetch(userData.discord_id);
                        if (user) {
                            const embed = createGateEmbed(null, messages.easterEggs.thinkingOfYou);
                            await user.send({ embeds: [embed] });
                            console.log(`✧ sent thinking-of-you to ${user.tag}`);
                        }
                    } catch (error) {
                        // User might have DMs closed
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

// Cleanup on shutdown
process.on('SIGINT', () => {
    console.log('✧ shutting down...');
    scheduledTasks.forEach(task => task.stop());
    process.exit(0);
});
