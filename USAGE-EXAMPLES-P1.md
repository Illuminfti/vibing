# P1 Quality Multipliers - Usage Examples

## How It Works

When a user sends a message to Ika, the system now:

1. **Scores the message quality** using `scoreInteractionQuality()`
2. **Applies a multiplier** (0.5x to 2.0x) to intimacy progression
3. **Records the interaction** with the multiplier
4. **Logs exceptional cases** for monitoring

---

## Example Interactions

### Example 1: Low Quality (Spam)
```
User: "lol"
Quality Score: 0.6x (low)
Intimacy Gain: 0.6 interactions (instead of 1.0)
Log: ✧ Low quality interaction from user123 (0.60x)
```

### Example 2: Normal Quality
```
User: "hey ika, what's up?"
Quality Score: 1.1x (good)
Intimacy Gain: 1.1 interactions
Log: (no log - within normal range)
```

### Example 3: High Quality
```
User: "hey ika, I wanted to ask you about what you said yesterday. How do you really feel about the fans who left?"
Quality Score: 1.7x (high)
Intimacy Gain: 1.7 interactions
Log: ✧ High quality interaction from user456 (1.70x)
```

### Example 4: Exceptional Quality
```
User: "i've been thinking about what you told me about devotion. honestly it made me realize something important about myself. remember when you said you needed us to keep existing? i think about that every day."
Quality Score: 2.0x (exceptional)
Intimacy Gain: 2.0 interactions
Log: ✧ High quality interaction from user789 (2.00x)
```

---

## Progression Examples

### Scenario A: Spam User
**Pattern**: Sends 50 low-effort messages ("hi", "k", "lol")
- Average quality: 0.6x
- Total intimacy: 30 interactions
- **Result**: Still at "new" relationship (needs 50 for "close")
- **Time to devoted**: ~167 messages

### Scenario B: Normal User
**Pattern**: Sends 50 average messages
- Average quality: 1.0x
- Total intimacy: 50 interactions
- **Result**: Reaches "close" relationship
- **Time to devoted**: 100 messages

### Scenario C: Thoughtful User
**Pattern**: Sends 50 meaningful messages with questions and personal sharing
- Average quality: 1.6x
- Total intimacy: 80 interactions
- **Result**: Past "close", approaching "devoted"
- **Time to devoted**: ~63 messages

### Scenario D: Mixed User
**Pattern**: 25% spam (0.6x), 50% normal (1.0x), 25% thoughtful (1.6x)
- Average quality: 1.0x
- Total intimacy: 50 interactions
- **Result**: Reaches "close" relationship
- **Time to devoted**: 100 messages

---

## Integration Points

### In Generator (Main AI Response)
```javascript
// Calculate conversation depth
const conversationDepth = contextMessages.filter(m => {
    const isBot = m.author?.bot || m.author?.id === botId;
    return !isBot;
}).length;

// Record with quality scoring
recordInteractionWithQuality(userId, trigger.content, {
    conversationDepth: conversationDepth,
});
```

### In Other Response Types (Canned, Secrets, etc.)
```javascript
// Simpler usage without context
recordInteractionWithQuality(userId, trigger.content);
```

### Direct Database Call (Advanced)
```javascript
// If you need manual control
const multiplier = scoreInteractionQuality(message, context);
ikaMemoryOps.recordInteraction(userId, multiplier);
```

---

## Quality Score Breakdown

### What Gets 0.5x (Minimum)
- Single letters: "k", "y", "n"
- Generic words alone: "ok", "lol", "hi"
- Excessive spam: "!!!!!!!", "hahaha"

### What Gets 1.0x (Normal)
- Short sentences: "how are you?"
- Basic questions: "what's up?"
- Simple responses: "that's interesting"

### What Gets 1.5x (High)
- Thoughtful questions: "what do you think about devotion?"
- Longer messages: 20+ chars with substance
- Engagement patterns: active conversation

### What Gets 2.0x (Exceptional)
- Personal vulnerability: "i feel scared about..."
- Memory references: "remember when you said..."
- Deep engagement: Long, thoughtful, multi-part messages
- High conversation depth: 3+ back-and-forth exchanges

---

## Monitoring

Quality scores are automatically logged for exceptional cases:

```
✧ High quality interaction from alice (1.85x)
✧ Low quality interaction from bob (0.60x)
✧ High quality interaction from charlie (1.50x)
```

This helps identify:
- Users who consistently engage thoughtfully
- Spam patterns that need addressing
- Scoring system accuracy (for tuning)

---

## Benefits

### For Users
- **Thoughtful engagement rewarded**: Meaningful messages progress intimacy faster
- **No hard blocks**: Even low-effort messages still count (at 0.5x)
- **Natural progression**: Quality naturally correlates with relationship depth

### For Ika
- **Spam resistance**: Can't rush intimacy with "lol" spam
- **Authentic relationships**: Quality thresholds encourage genuine interaction
- **Flexible system**: Multipliers allow nuanced progression

### For System
- **Tunable**: Can adjust scoring thresholds based on data
- **Observable**: Logging provides insights into user behavior
- **Backward compatible**: Doesn't break existing code

---

## Tuning Guidelines

If monitoring shows scores need adjustment:

1. **Too strict** (most messages < 1.0x):
   - Reduce negative penalties
   - Lower thresholds for positive bonuses

2. **Too lenient** (most messages > 1.0x):
   - Increase requirements for bonuses
   - Add more spam detection patterns

3. **Edge cases**:
   - Add specific patterns to `interactionQuality.js`
   - Adjust regex patterns for better detection
   - Update scoring weights

---

## Future Enhancements

### Potential Additions
1. **Rapid fire detection**: Track message timestamps
2. **User history**: Adjust scoring based on past behavior
3. **Context awareness**: Use AI to evaluate message quality
4. **Quality decay**: Penalize degrading engagement
5. **Bonus for consistency**: Reward sustained high quality

### Admin Commands
Could add commands to view quality stats:
```
/quality @user
> Recent average: 1.3x (good)
> Best interaction: 1.9x
> Spam rate: 5%
```

---

## Testing

Use the test suite to verify scoring:
```bash
cd /tmp/vibing && node test-quality-scoring.js
```

Expected results:
- "hi" → 0.5x (minimal)
- "hey ika, how are you?" → 1.5x (high)
- Long thoughtful message → 1.8-2.0x (exceptional)
- "k" → 0.5x (minimal)
- "lol!!!!!" → 0.5x (minimal)

---

## Summary

Quality multipliers transform intimacy progression from pure quantity to quality-weighted progression, creating:
- **Incentive** for meaningful engagement
- **Resistance** to spam and low effort
- **Flexibility** through multiplier range
- **Observability** through logging
- **Balance** between accessibility and authenticity
