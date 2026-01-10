# P1: Quality-Based Intimacy Multipliers - Implementation Notes

**Status**: ✅ COMPLETED
**Date**: 2026-01-10
**Priority**: P1

---

## Overview

Implemented a quality scoring system that applies multipliers (0.5x to 2.0x) to intimacy progression based on interaction quality. This prevents spam and low-effort messages from progressing intimacy as fast as thoughtful engagement.

---

## Files Created

### 1. `/tmp/vibing/src/ika/interactionQuality.js` (NEW)
Quality scoring module with three main exports:

- **`scoreInteractionQuality(message, context)`**: Core scoring function
  - Returns: `number` (0.5 to 2.0 multiplier)
  - Parameters:
    - `message`: User's message text
    - `context`: Object with optional properties:
      - `messageLength`: Length of message
      - `hasQuestion`: Boolean - contains question
      - `conversationDepth`: Number of back-and-forth messages
      - `isRapidFire`: Boolean - rapid successive messages

- **`getQualityTier(multiplier)`**: Returns tier description ("exceptional", "high", "good", "normal", "low", "minimal")

- **`getQualityIndicator(multiplier)`**: Returns visual stars (⭐ to ⭐⭐⭐)

---

## Files Modified

### 2. `/tmp/vibing/src/database.js`
**Changed**: `ikaMemoryOps.recordInteraction(userId, multiplier = 1.0)`

**Before**:
```javascript
recordInteraction(userId) {
    db.prepare(`
        UPDATE ika_memory
        SET interaction_count = interaction_count + 1,
            last_interaction = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `).run(userId);
```

**After**:
```javascript
recordInteraction(userId, multiplier = 1.0) {
    db.prepare(`
        UPDATE ika_memory
        SET interaction_count = interaction_count + ?,
            last_interaction = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `).run(multiplier, userId);
```

**Impact**: Interaction count now increments by multiplier value instead of always +1. Backward compatible (defaults to 1.0).

---

### 3. `/tmp/vibing/src/ika/memory.js`
**Changed**: Updated `recordInteraction()` wrapper to pass through multiplier

**Before**:
```javascript
function recordInteraction(userId) {
    return ikaMemoryOps.recordInteraction(userId);
}
```

**After**:
```javascript
function recordInteraction(userId, multiplier = 1.0) {
    return ikaMemoryOps.recordInteraction(userId, multiplier);
}
```

---

### 4. `/tmp/vibing/src/ika/generator.js`
**Major Changes**:

#### A. Added Import
```javascript
const { scoreInteractionQuality } = require('./interactionQuality');
```

#### B. Added Helper Function
Created `recordInteractionWithQuality(userId, content, options)` helper that:
1. Scores interaction quality using `scoreInteractionQuality()`
2. Calls `recordInteraction(userId, multiplier)`
3. Logs exceptional quality interactions (>= 1.5x or <= 0.7x)

#### C. Updated All `recordInteraction()` Calls
Replaced 6 instances of `recordInteraction(userId)` with `recordInteractionWithQuality(userId, content, options)`:

1. **Line ~199**: Secret phrase triggers
2. **Line ~280**: Canned responses
3. **Line ~319**: Channel-restricted (resting mode)
4. **Line ~330**: Quota exhausted
5. **Line ~347**: Cost-optimized canned responses
6. **Line ~582**: Main AI-generated response (with full context including conversationDepth)

---

## Quality Scoring Logic

### Base Score: 1.0

### Positive Indicators (increase score):
- ✅ Message length 20+ chars, 5+ words: **+0.2**
- ✅ Thoughtful question (4+ words): **+0.3**
- ✅ Personal sharing/vulnerability patterns: **+0.3**
  - "i feel", "i think", "honestly", "i'm scared/worried/excited"
- ✅ Memory/past event mentions: **+0.4**
  - "remember when", "you said", "yesterday", "last time"
- ✅ Creative/unique phrasing (15+ words, varied vocabulary): **+0.2**
- ✅ Response patterns (engagement indicators): **+0.3**
  - "because", "well", "actually", "to be honest"
- ✅ Conversation depth (3+ back-and-forth messages): **+0.2**

### Negative Indicators (decrease score):
- ❌ Very short message (< 10 chars): **-0.3**
- ❌ Generic single-word phrases: **-0.4**
  - "hey", "hi", "ok", "k", "lol", "yeah", "idk", etc.
- ❌ Lazy typing (1-2 lowercase letters): **-0.2**
- ❌ Spam patterns (repeated chars): **-0.3**
  - "hahaha", "yessss", "lololo"
- ❌ Excessive punctuation (4+ !?): **-0.3**
- ❌ Emoji spam (5+ emoji, < 5 words): **-0.3**
- ❌ Rapid fire messages: **-0.2**

### Range: Clamped to [0.5, 2.0]

---

## Test Results

All test cases passing with expected scores:

| Message | Score | Quality |
|---------|-------|---------|
| "hi" | 0.50x | minimal ⭐ |
| "hey ika, how are you doing today?" | 1.50x | high ⭐⭐⭐ |
| "k" | 0.50x | minimal ⭐ |
| "i wanted to tell you something..." (long, personal) | 2.00x | exceptional ⭐⭐⭐ |
| "lol!!!!!" | 0.50x | minimal ⭐ |
| "hahahahaha" | 0.70x | low ⭐ |
| "remember when you said..." | 2.00x | exceptional ⭐⭐⭐ |
| "what do you think about..." | 1.50x | high ⭐⭐⭐ |
| "ok" | 0.50x | minimal ⭐ |

---

## Impact on Intimacy Progression

### Before:
- All interactions: +1.0 to interaction_count
- 10 interactions → familiar
- 50 interactions → close
- 100 interactions → devoted

### After:
- Quality multiplier applied to each interaction
- Spam message: +0.5 to interaction_count
- Normal message: +1.0 to interaction_count
- High quality: +1.5 to interaction_count
- Exceptional: +2.0 to interaction_count

**Example Scenarios**:

1. **Spam User** (20 "lol" messages):
   - Before: 20 interactions counted
   - After: 10 interactions counted (0.5x each)

2. **Thoughtful User** (20 meaningful messages):
   - Before: 20 interactions counted
   - After: 30-40 interactions counted (1.5-2.0x each)

3. **Mixed User** (50% spam, 50% normal):
   - Before: 20 interactions counted
   - After: 15 interactions counted (0.75x average)

---

## Logging

Quality scores are logged for monitoring:

```
✧ High quality interaction from username (1.75x)
✧ Low quality interaction from username (0.60x)
```

Only exceptional cases (>= 1.5x or <= 0.7x) are logged to avoid spam.

---

## Backward Compatibility

✅ **Fully backward compatible**:
- `recordInteraction(userId)` still works (defaults to 1.0x multiplier)
- Existing code paths continue to function
- Database schema unchanged (interaction_count is still a number, just increments by fractional amounts)

---

## Future Enhancements (Optional)

### Part 5: Admin Visibility
Could add to `/bond` or `/journey` command:
- Show "recent interaction quality" average
- Display quality trend over time
- Visual quality indicators in user stats

**Example**:
```
Recent Quality: ⭐⭐⭐ (1.6x average)
Interaction Trend: Improving ↗
```

### Additional Improvements:
1. **Rapid Fire Detection**: Track message timestamps to detect spam patterns
2. **Context Awareness**: Use more conversation context for better scoring
3. **Adaptive Thresholds**: Adjust scoring based on user history
4. **Quality Decay**: Penalize users who consistently spam after good interactions

---

## Testing Commands

```bash
# Compile-test all files
cd /tmp/vibing && \
node -c src/ika/interactionQuality.js && \
node -c src/database.js && \
node -c src/ika/memory.js && \
node -c src/ika/generator.js

# Run quality scoring tests
cd /tmp/vibing && node test-quality-scoring.js
```

---

## Deployment Notes

1. ✅ All files compile successfully
2. ✅ Test cases passing
3. ✅ No database migrations required (interaction_count is already a REAL/FLOAT)
4. ✅ Backward compatible with existing code
5. ✅ Logging in place for monitoring
6. ⚠️ Monitor logs after deployment to tune scoring thresholds if needed

---

## Summary

Quality-based intimacy multipliers successfully implemented. The system:
- ✅ Prevents spam from progressing intimacy as fast as thoughtful engagement
- ✅ Rewards meaningful interactions (up to 2.0x multiplier)
- ✅ Penalizes low-effort messages (down to 0.5x multiplier)
- ✅ Maintains backward compatibility
- ✅ Includes comprehensive logging for monitoring
- ✅ All test cases passing

**Impact**: Users who engage thoughtfully will build intimacy ~2-4x faster than spammers, creating incentive for quality interactions while not completely blocking progression for casual users.
