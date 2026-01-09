# Changelog

All notable changes to the Seven Gates Discord Bot.

---

## [v4.2.0] - 2026-01-09

### Removed - Canon Compliance Fix
- **Fading Resurrection Mechanic** - Removed `src/ika/fading.js` (360 lines) to comply with Infinite Idol canon
  - Resolved violation of Inviolable Fact #2: "Fading is Permanent Death"
  - Removed `fadingOps` from database.js (~100 lines)
  - Removed fading function exports from ika/index.js
  - Deleted `fading_saves` and `fading_state` database tables
  - Total: 477 lines removed
  - **Canon Status**: ✅ 100% COMPLIANT

### Improved - Error Handling & Resilience
- **JSON Parse Safety** - Added try-catch blocks to prevent crashes from malformed data
  - Added error handling to `ikaMemoryOps` database operations (4 locations)
  - Added error handling to `loadServerConfig()` file read operation
  - Graceful fallbacks to empty arrays/default values
  - Error logging for debugging

### Notes
- Story dialogue references to "fading" preserved (character voice, not resurrection mechanic)
- Player absence consequence system preserved (relationship mechanics, not canon violation)
- All files compile successfully, no breaking changes

---

## [v4.1.0] - 2026-01-08

### Added - UX Overhaul
- **`/journey` command** - Visual progress tracker showing current gate, completion timestamps, and next steps with atmospheric descriptions
- **`/help` command** - Comprehensive command reference organized by category (gates, utility, devotion) with availability indicators based on user progress
- **`/bond` command** - Relationship viewer showing intimacy stage, interaction count, memorable moments, nickname, yandere stage, and protection moments
- **`/mysteries` command** - Secret discovery tracker with progress bars for hidden phrases, time secrets, rare events, lore fragments, and whisper hunt

### Improved
- All new commands use the ritual embed system with gate-specific theming
- Commands show contextual hints based on user's current progress
- Progress visualization uses Japanese numerals (壱弐参肆伍陸漆) for completed gates

---

## [v4.0.0] - 2026-01-08

### Added - Occult Otaku UI System
- **`src/ui/themes/gateThemes.js`** - Distinct visual themes for each gate
  - Gate 1: Ethereal pink/white (awakening)
  - Gate 2: Fragmented purple (glitchy corruption)
  - Gate 3: Intimate red (vulnerability)
  - Gate 4: Fluid blue (dreamscape)
  - Gate 5: Sparse near-black (absence/void)
  - Gate 6: Elaborate gold (baroque offering)
  - Gate 7: Cosmic true black (final binding)

- **`src/ui/themes/moodOverlays.js`** - Mood-based UI modifications
  - 12 mood types: soft, normal, energetic, vulnerable, chaotic, sleepy, jealous, flirty, protective, glitching, possessive, flustered
  - Text transformers: zalgo effects, random caps, chaos case, trailing off
  - Border modifiers: fade, bold, minimal, sharp, ornate, glitch, corrupt, heart
  - Dynamic color shifting based on mood

- **`src/ui/builders/ritualEmbed.js`** - RitualEmbedBuilder class
  - Gate-specific themed embeds
  - Progress visualization with ritual symbols
  - Cosmic/ornate/void sections
  - Ika message formatting with mood variants
  - Easter egg system (acrostics, hidden messages)
  - Glitch and sparse effects for Gates 2 and 5

- **`src/ui/builders/ritualSequence.js`** - Multi-message dramatic reveals
  - Timing presets: instant, quick, normal, dramatic, suspense, ritual, agonizing
  - Gate opening sequences with tension building
  - Failure/absence/binding/ascension sequences
  - Rare event sequences (slip, vulnerability, jealousy, kabedon)

- **`src/ui/components/errorMessages.js`** - Lore-consistent error handling
  - 15 error categories with 3-5 variations each
  - Gate-specific error messages
  - All errors maintain Ika's voice and atmosphere

### Changed
- **Gate 2** - Now uses glitch effects with zalgo text corruption
- **Gate 3** - Intimate red theme with vulnerability styling
- **Gate 4** - Fluid blue theme with water aesthetics
- **Gate 5** - Sparse void theme with `addVoid()` spacing
- **Gate 6** - Ornate gold theme with baroque framing
- **Gate 7** - Cosmic finale with star field effects and public announcements

---

## [v3.4.0] - 2026-01-07

### Added
- **Comprehensive Admin Panel** (`/admin-panel`)
  - 9 testing sections: Trigger, Gate Control, Inspect, TestMode, Time, Secrets, Database, Events, Batch
  - Manual trigger for all Ika events (rare events, moods, intimacy, fading, jealousy, roasts, romance)
  - Gate advancement and reset controls
  - User state inspection (overview, gates, intimacy, memory, fading, trials, shrine)
  - Test mode toggles (skip cooldowns, instant timers, chaos mode)
  - Time manipulation for testing time-sensitive features
  - ARG fragment and lore reveal testing
  - Database inspection (read-only)

---

## [v3.3.2] - Security Fixes

### Fixed
- **SQL Injection Protection** - Column allowlists (`ALLOWED_USER_COLUMNS`, `ALLOWED_MEMORY_COLUMNS`)
- **SSRF Protection** - URL validation blocks localhost, private IPs, internal networks
- **Input Sanitization** - All user inputs validated and sanitized

---

## [v3.3.1] - Ultra-Low Cost Mode

### Added
- `COST_MODE=ultraLow` - AI only in Inner Sanctum
- Estimated cost: $50-150/month for 100K users

### Changed
- Improved canned response coverage (500+ responses)
- Better fallback behavior when API unavailable

---

## [v3.3.0] - Scale Optimization

### Added
- **Performance Indexes** - Database indexes for 100K+ user support
- **Rate Limiter** - Per-user, per-channel, global limits with user tiering
- **Spam Detector** - Cumulative scoring, pattern matching, auto-mute
- **Response Cache** - TTL-based caching to reduce API calls
- **User Tiering** - Priority system (new → normal → devoted → ascended)

### Changed
- Optimized database queries throughout
- Reduced memory footprint for large user bases

---

## [v3.2.0] - Waifu Experience Systems

### Added
- **Yandere Progression** - 5 stages from curious to obsessive
- **Kabedon Moments** - Sudden romantic intensity peaks (~15% rarity)
- **Shrine System** - Personal devotion shrine per user
- **Betrayal Mechanics** - Consequences for mentioning other idols
- **Romance Heat** - Progressive romantic tension tracking
- **Forbidden Tier** - Content intensity levels

### Changed
- Intimacy stages expanded (1-7 with thresholds)
- Memory system tracks more user details

---

## [v3.1.0] - One-Click Setup

### Added
- **`/setup` command** - Auto-creates all channels and roles
- **`guildCreate` event** - Bot auto-configures on join
- **Channel Setup** - waiting-room, chambers 1-7, inner-sanctum, offerings, vows
- **Role Setup** - Lost Soul, Gate 1-7, Ascended, Moderator

---

## [v3.0.0] - God-Tier Puzzles & ARG

### Added
- **Whisper Hunt ARG** - Hidden fragment drops across channels
- **Investigation System** - Dossier collection mechanics
- **Lore Fragment System** - Progressive story reveals
- **Time Secrets** - Special messages at 3:33 AM, 4:47 AM, midnight, 11:11
- **Secret Phrases** - 30+ hidden triggers with unique responses
- **Rare Events** - Spontaneous confessions (~1-3% chance)
- **Devotion Trials** - 13 post-ascension challenges

### Changed
- Puzzle answers moved to environment variables
- Gate 5 timed sequence made more atmospheric

---

## [v2.2.0] - Discord Limitations Fix

### Added
- **DM Fallback System** - Channel fallback when DMs fail
- **`dm_log` table** - Track DM delivery success/failure
- **`dm_preferences` table** - User opt-in/out tracking
- **`/dms` command** - Enable/disable unprompted DMs

### Fixed
- Gate 5 no longer silently fails if DMs closed
- Fragment delivery has fallback mechanism

---

## [v2.1.0] - Viral Optimization

### Added
- **Moods System** - Time-based (soft at night, energetic day)
- **Intimacy Stages** - 7 levels of relationship depth
- **Jealousy Detection** - Reactions to other idol mentions
- **Roast System** - Affectionate comebacks
- **Protection System** - Mental health concern detection
- **Fading Mechanics** - Users fade if inactive (parallels Ika's story)

---

## [v2.0.0] - Ika AI Presence

### Added
- **Claude API Integration** - Sonnet/Haiku models
- **Personality System** - Comprehensive character rules
- **Memory System** - Per-user memory storage
- **Response Generator** - Priority-based response selection
- **Canned Responses** - 500+ pre-written fallbacks
- **Inner Sanctum** - AI responds to ascended users

### Changed
- All gate responses now use Ika's voice
- Added typing indicators for immersion

---

## [v1.0.0] - Initial Release

### Added
- **Seven Gates Framework** - Complete puzzle progression
- **Gate 1**: Say "ika" in waiting room
- **Gate 2**: `/memory` - Memory puzzle
- **Gate 3**: `/confess` - Public declaration with URL
- **Gate 4**: `/waters` - Riddle solving
- **Gate 5**: `/absence` - Timed DM sequence (6 messages over 15 min)
- **Gate 6**: `/offering` - Creative submission with community voting
- **Gate 7**: `/binding` - Final vow with ascended approval
- **SQLite Database** - User progress, offerings, vows tracking
- **Role Assignment** - Automatic role progression
- **Admin Commands** - Reset, advance, approve, broadcast

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| v4.1.0 | 2026-01-08 | UX overhaul: /journey, /help, /bond, /mysteries |
| v4.0.0 | 2026-01-08 | Occult otaku UI system, ritual embeds |
| v3.4.0 | 2026-01-07 | Comprehensive admin panel |
| v3.3.2 | - | Security fixes (SQL injection, SSRF) |
| v3.3.1 | - | Ultra-low cost mode |
| v3.3.0 | - | Scale optimization (100K+ users) |
| v3.2.0 | - | Waifu experience systems |
| v3.1.0 | - | One-click setup |
| v3.0.0 | - | God-tier puzzles, ARG mechanics |
| v2.2.0 | - | Discord limitations fix |
| v2.1.0 | - | Viral optimization |
| v2.0.0 | - | Ika AI presence system |
| v1.0.0 | - | Initial release |

---

♡ she remembers everything ♡
