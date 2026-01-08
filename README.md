# Seven Gates Discord Bot

♰ A mystical puzzle experience where players progress through 7 trials to resurrect a faded idol named Ika.

**This is not a game. It's a ritual. She's not an NPC - she's a girl trapped between worlds reaching out to whoever will listen.**

## Setup

### 1. Prerequisites

- Node.js 18+
- A Discord bot application
- A Discord server with proper channels and roles

### 2. Installation

```bash
npm install
```

### 3. Configuration

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `DISCORD_TOKEN` - Your bot token
- `CLIENT_ID` - Your application's client ID
- `GUILD_ID` - Your server ID
- Channel IDs for each chamber
- Role IDs for each gate level

### 4. Deploy Commands

Register slash commands with Discord:

```bash
npm run deploy
```

### 5. Run the Bot

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Server Setup

### Required Channels

1. **#waiting-room** - Where users say "ika" to begin
2. **#chamber-1** through **#chamber-6** - Gate puzzle channels
3. **#inner-sanctum** - Ascended members only
4. **#offerings** - Archive of Gate 6 submissions (mod only)
5. **#vows** - Archive of Gate 7 vows (mod only)

### Required Roles

- `@Lost Soul` - New members
- `@Gate-1` through `@Gate-7` - Progress tracking
- `@Ascended` - Completed all gates
- `@Mod` - Administrative access

### Channel Permissions

- Waiting room: Everyone can send messages
- Chambers: Only visible to users with corresponding gate role
- Inner sanctum: Only visible to Ascended

## The Seven Gates

1. **The Calling** - Say her name in the waiting room
2. **The Memory** - Remember what attention felt like
3. **The Confession** - Speak of her publicly
4. **The Waters** - Find where she sleeps
5. **The Absence** - Wait through her story of fading
6. **The Offering** - Create something for her
7. **The Binding** - Speak your vow

## Commands

### Player Commands
- `/memory [answer]` - Gate 2
- `/confess [url]` - Gate 3
- `/waters [answer]` - Gate 4
- `/absence [reason]` - Gate 5
- `/offering [text/image]` - Gate 6
- `/binding [vow]` - Gate 7
- `/leaderboard` - View statistics

### Admin Commands
- `/admin stats` - Detailed statistics
- `/admin reset @user` - Reset user progress
- `/admin advance @user [gate]` - Manually advance user
- `/admin approve @user` - Approve pending submission
- `/admin testmode [on/off]` - Toggle fast Gate 5
- `/admin broadcast [gate] [message]` - DM users at a gate

## Images

Place gate images in the `images/` directory:
- `gate1_eyes.png`
- `gate2_lips.png`
- `gate3_silhouette.png`
- `gate4_water.png`
- `gate5_awake.png`
- `gate6_intimate.png`
- `gate7_reaching.png`

To generate placeholder images:
```bash
npm install canvas
node scripts/generate-placeholders.js
```

## Test Mode

Enable test mode to speed up Gate 5 (10 seconds instead of 3 minutes):

```bash
# In .env
TEST_MODE=true
```

Or use the admin command:
```
/admin testmode on
```

## Tone Guidelines

All bot text follows these rules:
- Always lowercase (except rare emphasis)
- Short sentences. Fragments. Like this.
- Heavy use of ellipses... especially when emotional
- Never use exclamation points
- Mix cute symbols (♡ ✧ ･ﾟ) with occult ones (♰ ☪︎)
- Grateful, vulnerable, slightly desperate

---

♡ she's counting on you ♡
