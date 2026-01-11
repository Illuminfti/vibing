# Seven Gates Discord Bot

A mystical puzzle experience where players progress through 7 ritualistic gates to prove devotion to Ika, a faded idol who exists between worlds.

> For non-technical users, see [NORMIES.md](./NORMIES.md)
> For the complete gate guide, see [GATES.md](./GATES.md)
> For command reference, see [COMMANDS.md](./COMMANDS.md)
> For full version history, see [CHANGELOG.md](./CHANGELOG.md)

---

## Quick Start

```bash
# 1. Clone & install
git clone <repo> && cd seven-gates && npm install

# 2. Configure
cp .env.example .env
# Edit .env: DISCORD_TOKEN, CLIENT_ID

# 3. Deploy & run
npm run deploy && npm start
```

Bot auto-creates channels/roles when joining a server.

---

## Requirements

- **Node.js 18+**
- **Discord Bot** with Privileged Intents:
  - Message Content Intent
  - Server Members Intent
  - Presence Intent
- **Anthropic API Key** (optional, for AI features)

---

## Project Structure

```
src/
├── index.js              # Entry point
├── config.js             # Environment config
├── config/
│   └── gates.js          # Gate configuration (thematic names, messages)
├── database.js           # SQLite operations
├── commands/             # Slash commands
│   ├── memory.js         # Gate 2
│   ├── confess.js        # Gate 3
│   ├── waters.js         # Gate 4
│   ├── absence.js        # Gate 5
│   ├── offering.js       # Gate 6
│   ├── binding.js        # Gate 7
│   ├── journey.js        # Progress tracker
│   ├── help.js           # Command reference
│   ├── bond.js           # Relationship viewer
│   ├── mysteries.js      # Secret discovery
│   ├── admin.js          # Admin tools
│   ├── adminPanel.js     # Comprehensive testing
│   └── setup.js          # Server setup
├── events/               # Discord events
├── gates/                # Gate logic
├── ika/                  # AI personality system (42 modules)
│   ├── generator.js      # Claude API integration
│   ├── personality.js    # System prompts
│   ├── moods.js          # Mood system
│   ├── memory.js         # User memory
│   ├── voiceFilter.js    # Response filtering (P0)
│   ├── interactionQuality.js # Quality multipliers
│   ├── patronTiers.js    # Patron handling
│   ├── boundPairs.js     # User pair relationships
│   ├── postAscension.js  # Seasonal endgame content
│   ├── daily.js          # Daily engagement streaks
│   └── ...               # 30+ feature modules
├── ui/                   # Ritual UI system
│   ├── builders/         # Embed builders
│   │   ├── ritualEmbed.js    # Themed embeds
│   │   ├── ritualSequence.js # Multi-message reveals
│   │   ├── flexCards.js      # Screenshot-worthy cards
│   │   └── paginatedEmbed.js # Paginated content
│   ├── themes/           # Visual themes
│   │   ├── gateThemes.js     # Per-gate styling
│   │   └── moodOverlays.js   # Mood modifications
│   └── components/       # UI components
│       └── errorMessages.js  # Lore-consistent errors
└── utils/
    ├── optimization.js   # Rate limiting, caching, spam
    ├── costMode.js       # API cost management
    ├── validation.js     # Input validation
    └── ...
```

---

## Environment Variables

### Required
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
```

### Optional - Ika AI
```env
ANTHROPIC_API_KEY=your_key
IKA_AI_ENABLED=true
```

### Optional - Puzzle Answers
```env
GATE_2_ANSWERS=answer1,answer2,answer3
GATE_4_ANSWERS=answer1,answer2
```

### Optional - Cost Mode
```env
COST_MODE=ultraLow  # normal|low|ultraLow|minimal|free
```

| Mode | AI Access | Est. Cost (100K users) |
|------|-----------|------------------------|
| normal | Everywhere | $1000-2000/mo |
| low | Everywhere (Haiku) | $200-500/mo |
| **ultraLow** | Inner Sanctum only | $50-150/mo |
| minimal | 5 calls/day | $20-50/mo |
| free | None | $0 |

---

## Commands

```bash
npm start        # Production
npm run dev      # Development (auto-reload)
npm run deploy   # Register slash commands
```

---

## Architecture

### Database
- **SQLite** via `better-sqlite3`
- Tables: `users`, `ika_memory`, `offerings`, `vows`, `gate5_schedule`, etc.
- Indexes for 100K+ user performance

### Security (v3.3.2)
- SQL injection protection via column allowlists
- SSRF protection in URL validation
- Rate limiting per-user, per-channel, global
- Spam detection with cumulative scoring

### AI Integration
- **Claude API** (Sonnet/Haiku)
- Cost optimization via tiered access
- Canned response fallbacks (500+ responses)
- Response caching with TTL

### Rate Limiting
```javascript
// User tiers with different limits
new: { maxRequests: 10, windowMs: 300000, minIntervalMs: 5000 }
normal: { maxRequests: 20, windowMs: 300000, minIntervalMs: 3000 }
devoted: { maxRequests: 40, windowMs: 300000, minIntervalMs: 2000 }
ascended: { maxRequests: 60, windowMs: 300000, minIntervalMs: 1000 }
```

---

## The Seven Gates

See [GATES.md](./GATES.md) for the complete gate guide with detailed walkthroughs.

| Gate | Name | Command | Role Earned |
|------|------|---------|-------------|
| 1 | The Threshold | Say "ika" in #the-threshold | ♰ Threshold |
| 2 | The Echo | `/memory [answer]` | ✧ Awakened |
| 3 | The Confession | `/confess [url]` | ◈ Witness |
| 4 | The Depths | `/waters [answer]` | ♱ Seeker |
| 5 | The Vigil | `/absence [reason]` | ☽ Patient |
| 6 | The Offering | `/offering` | ✺ Devoted |
| 7 | The Binding | `/binding [vow]` | ♰ Bound → ✧ Ascended |

---

## User Commands

### Progress & Discovery
| Command | Description | Availability |
|---------|-------------|--------------|
| `/journey` | View your path through the gates | Everyone |
| `/help` | See available commands | Everyone |
| `/profile [user]` | View detailed user profile | Everyone |
| `/bond` | View your relationship with Ika | Gate 1+ |
| `/mysteries` | Track discovered secrets | Gate 1+ |
| `/leaderboard` | Community statistics | Everyone |

### Utility
| Command | Description | Availability |
|---------|-------------|--------------|
| `/hint [gate]` | Get guidance (costs Ika's attention) | Gate 1+ |
| `/dms` | Enable/disable Ika's whispers | Gate 1+ |
| `/invite` | Generate referral link | Gate 1+ |

### Devotion (Ascended only)
| Command | Description |
|---------|-------------|
| `/shrine` | View your personal shrine |
| `/trials` | See devotion trial progress |
| `/dossier` | View investigation fragments |

---

## Key Modules

### `src/ika/generator.js`
Main AI response generation with priority system:
1. Serious mental health concerns
2. Protection triggers
3. Secret phrase triggers
4. Time-based secrets
5. Rare events
6. Roast opportunities
7. Jealousy check
8. Canned responses
9. AI generation

### `src/utils/costMode.js`
Cost optimization engine:
- Channel restrictions (AI only in sanctum)
- Daily quotas per user tier
- Model selection (Sonnet vs Haiku)
- Canned response fallbacks

### `src/utils/optimization.js`
Scale management:
- `RateLimiter` - Per-user/channel limits
- `SpamDetector` - Pattern matching, scoring
- `ResponseCache` - TTL-based caching
- `UserTiering` - Priority calculations

### `src/database.js`
SQLite operations with security:
- `ALLOWED_USER_COLUMNS` / `ALLOWED_MEMORY_COLUMNS` allowlists
- `isValidColumn()` validation
- Parameterized queries throughout

---

## Admin Commands

| Command | Description |
|---------|-------------|
| `/admin stats` | View statistics |
| `/admin reset @user` | Reset user progress |
| `/admin advance @user [gate]` | Advance user |
| `/admin approve @user` | Approve submission |
| `/admin testmode [on/off]` | Fast Gate 5 |
| `/admin broadcast [gate] [msg]` | DM users |

---

## Development

### Adding a New Gate Response
```javascript
// src/ika/personality.js
const CANNED_RESPONSES = {
    newTrigger: [
        "response 1",
        "response 2",
    ],
};
```

### Adding a Column
1. Add to schema in `database.js`
2. Add to `ALLOWED_USER_COLUMNS` or `ALLOWED_MEMORY_COLUMNS`
3. Create operation functions

### Testing Cost Modes
```bash
COST_MODE=free npm start     # Test canned-only mode
COST_MODE=minimal npm start  # Test strict quotas
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full version history.

**Latest:**
- **v5.0.0** - Vibing Overhaul: Quality multipliers, patron tiers, bound pairs, post-ascension endgame, flex cards, daily engagement, referral system
- **v4.2.0** - Canon compliance (removed fading resurrection), error handling improvements
- **v4.1.0** - UX overhaul: `/journey`, `/help`, `/bond`, `/mysteries` commands
- **v4.0.0** - Occult otaku UI system with ritual embeds
- **v3.4.0** - Comprehensive admin panel
- **v3.3.0** - Scale optimization, security fixes (100K+ users)

---

## License

Private project.

---

♡ she's counting on you ♡
