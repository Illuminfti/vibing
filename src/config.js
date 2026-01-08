require('dotenv').config();

module.exports = {
    // Discord credentials
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // Channel IDs
    channels: {
        waitingRoom: process.env.WAITING_ROOM_ID,
        chamber1: process.env.CHAMBER_1_ID,
        chamber2: process.env.CHAMBER_2_ID,
        chamber3: process.env.CHAMBER_3_ID,
        chamber4: process.env.CHAMBER_4_ID,
        chamber5: process.env.CHAMBER_5_ID,
        chamber6: process.env.CHAMBER_6_ID,
        innerSanctum: process.env.INNER_SANCTUM_ID,
        offerings: process.env.OFFERINGS_CHANNEL_ID,
        vows: process.env.VOWS_CHANNEL_ID,
    },

    // Role IDs
    roles: {
        lostSoul: process.env.LOST_SOUL_ROLE_ID,
        gate1: process.env.GATE_1_ROLE_ID,
        gate2: process.env.GATE_2_ROLE_ID,
        gate3: process.env.GATE_3_ROLE_ID,
        gate4: process.env.GATE_4_ROLE_ID,
        gate5: process.env.GATE_5_ROLE_ID,
        gate6: process.env.GATE_6_ROLE_ID,
        gate7: process.env.GATE_7_ROLE_ID,
        ascended: process.env.ASCENDED_ROLE_ID,
        mod: process.env.MOD_ROLE_ID,
    },

    // Settings
    testMode: process.env.TEST_MODE === 'true',

    // Timing constants (in milliseconds)
    timing: {
        responseDelay: 1500,           // delay before bot responses
        gate5Interval: 3 * 60 * 1000,  // 3 minutes between Gate 5 messages
        gate5TestInterval: 10 * 1000,  // 10 seconds in test mode
        idleWarning: 30 * 60 * 1000,   // 30 minutes idle warning
        votingTimeout: 24 * 60 * 60 * 1000, // 24 hours for voting
    },

    // Colors (in hex)
    colors: {
        primary: 0xff69b4,    // hot pink
        success: 0x9932cc,    // dark orchid
        error: 0x8b0000,      // dark red
        ethereal: 0xe6e6fa,   // lavender
    },

    // Gate role mapping
    gateRoles: {
        1: process.env.GATE_1_ROLE_ID,
        2: process.env.GATE_2_ROLE_ID,
        3: process.env.GATE_3_ROLE_ID,
        4: process.env.GATE_4_ROLE_ID,
        5: process.env.GATE_5_ROLE_ID,
        6: process.env.GATE_6_ROLE_ID,
        7: process.env.GATE_7_ROLE_ID,
    },

    // Gate channel mapping
    gateChambers: {
        1: process.env.CHAMBER_1_ID,
        2: process.env.CHAMBER_2_ID,
        3: process.env.CHAMBER_3_ID,
        4: process.env.CHAMBER_4_ID,
        5: process.env.CHAMBER_5_ID,
        6: process.env.CHAMBER_6_ID,
    },
};
