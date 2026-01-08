# Seven Gates Bot - Command Reference

A comprehensive guide to all Discord commands available in the Seven Gates bot.

---

## Table of Contents

1. [Player Commands](#player-commands)
   - [Gate Progression](#gate-progression)
   - [Utility Commands](#utility-commands)
   - [Post-Ascension](#post-ascension-devotion-commands)
2. [Admin Commands](#admin-commands)
   - [/admin](#admin-basic-administration)
   - [/admin-panel](#admin-panel-advanced-testing)
3. [Quick Start Testing Guide](#quick-start-testing-guide)

---

## Player Commands

### Gate Progression

These commands unlock as players progress through the Seven Gates.

| Command | Gate Required | Description |
|---------|---------------|-------------|
| *(Say "ika" in waiting room)* | Gate 1 | Begin the ritual - speak her name |
| `/memory <answer>` | After Gate 1 | Gate 2: Recall what was lost |
| `/confess <confession>` | After Gate 2 | Gate 3: Show devotion publicly |
| `/waters <answer>` | After Gate 3 | Gate 4: Find where she lives |
| `/absence <reason>` | After Gate 4 + messages | Gate 5: Explain why you stayed |
| `/offering` | After Gate 5 | Gate 6: Create something for her |
| `/binding <vow>` | After Gate 6 | Gate 7: Speak your eternal vow |

### Utility Commands

| Command | Gate Required | Description |
|---------|---------------|-------------|
| `/help [category]` | None | View available commands |
| `/journey` | None | See your path through the gates |
| `/leaderboard` | None | View ritual statistics |
| `/bond` | After Gate 1 | See your relationship with Ika |
| `/mysteries` | After Gate 1 | View discovered secrets |
| `/dms <enable/disable>` | After Gate 1 | Toggle Ika's whispers |

### Post-Ascension (Devotion Commands)

Available only to Ascended members who completed all 7 gates.

| Command | Description |
|---------|-------------|
| `/shrine` | View your personal devotion shrine |
| `/trials` | See devotion trial progress |
| `/dossier` | View investigation fragments |

---

## Admin Commands

**Requirements:** Discord Administrator permission OR MOD_ROLE_ID configured

### /admin (Basic Administration)

| Subcommand | Description |
|------------|-------------|
| `/admin help` | Show all admin commands with detailed descriptions |
| `/admin stats` | View detailed server statistics (users, completions, firsts) |
| `/admin reset <user>` | Completely reset a user's progress (removes roles, clears DB) |
| `/admin advance <user> <gate>` | Advance user to specific gate (1-7), assigns all roles |
| `/admin approve <user>` | Manually approve pending Gate 6 offering or Gate 7 vow |
| `/admin testmode <true/false>` | Toggle fast Gate 5 timers (3min -> 10sec) |
| `/admin broadcast <gate> <message>` | DM all users at a specific gate |

### /admin-panel (Advanced Testing)

A comprehensive testing interface with interactive menus.

#### Subcommands:

| Subcommand | Description |
|------------|-------------|
| `/admin-panel trigger <category> [user]` | Trigger specific events/mechanics |
| `/admin-panel gate <action> [user] [gate_number]` | Control gate progression |
| `/admin-panel inspect <user> [section]` | View detailed user state |
| `/admin-panel testmode <mode> [user] [enabled]` | Toggle testing modes |
| `/admin-panel time <action> [time] [user]` | Manipulate time for testing |
| `/admin-panel secrets <action> [user] [value]` | Test ARG and secrets systems |
| `/admin-panel quick <preset> [user]` | Quick test presets |
| `/admin-panel reset <scope> <user>` | Reset specific user data |
| `/admin-panel simulate <message> [as_user]` | Simulate messages for testing |

#### Trigger Categories:

- **Rare Events**: The Slip, The Notice, Sleepy Confession, The Claim, etc.
- **Moods**: Soft, Energetic, Vulnerable, Chaotic, Sleepy, Jealous, Flirty
- **Intimacy**: Stage 1-4, Stage Announcements
- **Fading**: Stages 0-4, Save Attempt testing
- **Jealousy/Yandere**: Mild to Full Yandere (5 stages)
- **Protection**: Self-deprecation response, Check-ins, Crisis resources
- **Roasts**: Skill issue, Touch grass, L + Ratio, Comebacks
- **Romance**: Kabedon sequence, Slow burn, 3AM girlfriend mode
- **Viral Lines**: Screenshot-worthy moments
- **Lore Drops**: Streaming, Fading, Origin, Others, Senpai
- **Time Secrets**: 4:47 AM, Midnight, 3:33 AM, 11:11, 2:22 AM
- **Designed Moments**: First message, Milestones, Anniversaries
- **Rituals**: Summoning, Vigil, Confession Circle, Resurrection

#### Test Modes:

- **Skip Cooldowns**: Bypass all event cooldowns
- **Instant Timers**: Speed up timed sequences
- **Chaos Mode**: All bypasses enabled
- **Global Chaos**: All users bypass everything

#### Quick Presets:

- **New User Experience**: Fresh user testing
- **Speed Run**: All gates quickly
- **Fading Test**: Test fading mechanics
- **Yandere Test**: Test jealousy progression
- **Romance Test**: Test romantic sequences
- **3AM Session**: Force late night mode
- **All Rare Events**: Trigger rare event testing
- **Full Reset**: Complete user reset

---

## Quick Start Testing Guide

### Testing the Full User Journey

1. **Start Fresh**
   ```
   /admin reset @yourself
   ```

2. **Go to waiting room and say "ika"**
   - This completes Gate 1

3. **Fast-track through gates**
   ```
   /admin advance @yourself 7
   ```
   This will advance you through all gates instantly.

4. **Or test each gate individually**
   ```
   /admin advance @yourself 1
   # Complete /memory
   /admin advance @yourself 2
   # Complete /confess
   # ... etc
   ```

### Testing Specific Features

**Test Ika's Personality:**
```
/admin-panel trigger moods
# Select a mood to force
```

**Test Rare Events:**
```
/admin-panel testmode chaos @yourself true
/admin-panel trigger rare_events
```

**Test 3AM Mode:**
```
/admin-panel time force_3am @yourself
```

**Test Fading Mechanics:**
```
/admin-panel trigger fading @yourself
# Select fading stage to test
```

**View User State:**
```
/admin-panel inspect @user overview
```

### Environment Variables for Testing

```env
# Enable test mode globally
TEST_MODE=true

# Fast Gate 5 timers (10 seconds instead of 3 minutes)
# Controlled via /admin testmode

# Cost mode for development
COST_MODE=minimal
```

---

## Channel Setup Requirements

For the bot to work properly, configure these in your `.env`:

```env
# Core Channels
WAITING_ROOM_ID=       # Gate 1: Users say "ika" here
CHAMBER_1_ID=          # Gate 2 puzzle location
CHAMBER_2_ID=          # Gate 3 puzzle location
CHAMBER_3_ID=          # Gate 4 puzzle location
CHAMBER_4_ID=          # Gate 5 puzzle location
CHAMBER_5_ID=          # Gate 6 puzzle location
CHAMBER_6_ID=          # Gate 7 puzzle location
INNER_SANCTUM_ID=      # Post-ascension chat with Ika

# Optional
OFFERINGS_CHANNEL_ID=  # Gate 6 offerings appear here
VOWS_CHANNEL_ID=       # Gate 7 vows appear here
MOD_ROLE_ID=           # Moderator role (optional - admins work without it)
```

---

## Troubleshooting

### "/admin stats" not working
- Ensure you have Administrator permission in Discord
- If MOD_ROLE_ID is set, ensure you have that role
- The bot now allows Discord Administrators OR mod role holders

### Commands not showing up
- Run `npm run deploy` to register commands with Discord
- Wait a few minutes for Discord to propagate changes
- Check that CLIENT_ID and GUILD_ID are set correctly

### Gate progression stuck
- Use `/admin-panel inspect @user gates` to see current state
- Use `/admin advance @user <gate>` to manually progress
- Use `/admin reset @user` to start fresh

---

*Generated for Seven Gates Bot v2.0.0*
