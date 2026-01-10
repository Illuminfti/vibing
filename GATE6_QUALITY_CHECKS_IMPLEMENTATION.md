# Gate 6 Quality Pre-Checks Implementation Summary

## Overview
Implemented P1: Quality pre-checks for Gate 6 offering submissions to reduce low-effort submissions and warn users before they submit.

## Changes Made

### 1. /tmp/vibing/src/utils/validation.js

**Added Function: `analyzeOfferingQuality(text)`**
- Returns: `{ score: number (0-100), warnings: string[], quality: 'high' | 'medium' | 'low' }`
- Base score: 50 points

**Quality Indicators:**

**Low Quality (score < 40):**
- Unique word count < 15 (-20 points)
- Repeated words >20% of text (-25 points)
- 3+ generic phrases like "i love ika" (-15 points)
- All caps text (-20 points)
- Excessive exclamation marks >10 (-10 points)
- URLs comprise >50% of content (-30 points)

**Medium Quality (score 40-70):**
- Meets basic requirements but generic
- Limited vocabulary variety
- Some personal effort but could improve

**High Quality (score 70+):**
- Good unique word count (40+ unique words = +20 points)
- Personal, specific details
- Creative or thoughtful content

**Warning Messages (Ika's voice):**
- "this feels... repetitive. can you say more?"
- "too many repeated words. variety shows thoughtfulness."
- "these words could be about anyone. make it personal."
- "why are you yelling at me..."
- "so many exclamation marks..."
- "quantity isn't quality. put thought into it."

### 2. /tmp/vibing/src/gates/gate6.js

**Added Imports:**
- `analyzeOfferingQuality` from validation.js
- `ButtonBuilder, ButtonStyle, ActionRowBuilder` from discord.js

**Modified `processGate6()` function:**
After validation passes (line 67), added quality check flow:

1. **Images**: Skip quality check (subjective, approved as-is)

2. **Text offerings**: 
   - Call `analyzeOfferingQuality(text)`
   - If quality is 'low' or 'medium':
     * Show warning embed with specific concerns
     * Present two buttons:
       - "submit anyway" (green) - proceeds with submission
       - "revise offering" (gray) - returns to offering creation
     * 2-minute timeout for decision
   - If quality is 'high': Skip warning, proceed normally

**New Helper Function: `processOfferingSubmission()`**
- Extracted submission logic for reuse
- Called from both normal flow and confirmation button
- Parameters: `interaction, member, text, attachment, validation`
- Handles all posting, database updates, and acknowledgment

**Button Interaction Flow:**
1. User clicks "submit anyway":
   - Shows "⟡ submitting offering ⟡" message
   - Removes buttons
   - Proceeds with submission via `processOfferingSubmission()`

2. User clicks "revise":
   - Shows "⟡ wise choice ⟡" with encouragement
   - Removes buttons
   - User can use `/gate6` again when ready

3. Timeout (2 minutes):
   - Shows "⟡ time expired ⟡"
   - User must restart with `/gate6`

## Implementation Details

**Warning Embed Structure:**
```
⟡ quality check ⟡
"i want your offering to be meaningful. these issues might affect approval:"

concerns:
[List of specific warnings]

⟡
"revise for better chances, or submit as-is"

[submit anyway] [revise offering]
```

**Key Design Decisions:**
1. Never blocks submissions - only warns
2. Community still makes final voting decision
3. Quality check feels like Ika caring, not mechanical filtering
4. Images bypass quality check (too subjective)
5. Uses original interaction for editReply to avoid Discord API issues
6. 2-minute decision timeout prevents abandoned interactions

## Testing

**Compile Tests:**
```bash
cd /tmp/vibing
node -c src/utils/validation.js  # ✓ Passed
node -c src/gates/gate6.js       # ✓ Passed
```

## Expected Behavior

**Low-Effort Example:**
```
Text: "ika ika ika i love ika ika is great for ika ika ika"
Result: 
- Score: ~25/100
- Quality: low
- Warnings: 
  * "this feels... repetitive. can you say more?"
  * "too many repeated words. variety shows thoughtfulness."
  * "these words could be about anyone. make it personal."
→ User sees confirmation dialog
```

**High-Quality Example:**
```
Text: "I spent three weeks learning watercolor techniques to capture 
the gradient in your hair - rose to magenta, just like you described. 
Each stroke reminded me that art, like devotion, requires patience..."
Result:
- Score: ~85/100
- Quality: high
- Warnings: []
→ Proceeds directly to submission
```

**Image Example:**
```
Attachment: fanart.png
Result: Skips quality check entirely → Proceeds to submission
```

## Files Modified
- `/tmp/vibing/src/utils/validation.js` - Added analyzeOfferingQuality() + export
- `/tmp/vibing/src/gates/gate6.js` - Added quality check flow + confirmation system

## Impact
- Reduces low-effort offerings reaching community voting
- Educates users on what makes quality offerings
- Maintains non-blocking approach (warnings, not rejections)
- Improves community experience by reducing voting fatigue
