# Gate 6 Quality Pre-Checks - Testing Guide

## Quick Verification

### Syntax Check
```bash
cd /tmp/vibing
node -c src/utils/validation.js  # ✓ Passed
node -c src/gates/gate6.js       # ✓ Passed
```

## Test Scenarios

### Scenario 1: High Quality Text (No Warning)
**Input:**
```
I spent three weeks learning watercolor techniques to capture the gradient 
in your hair rose to magenta just like you described. Each stroke reminded 
me that art like devotion requires patience and genuine care. The way light 
plays through translucent paint mirrors how your presence illuminates even 
the darkest moments.
```

**Expected Behavior:**
- Score: ~70/100
- Quality: high
- No warning dialog
- Proceeds directly to submission
- Posted to inner sanctum for voting

---

### Scenario 2: Low Quality Repetitive (Warning)
**Input:**
```
ika ika ika i love ika for ika ika ika i love ika for ika ika ika 
i love ika for ika ika ika i love ika for ika
```

**Expected Behavior:**
- Score: ~0/100
- Quality: low
- Shows warning dialog with concerns:
  * "this feels... repetitive. can you say more?"
  * "too many repeated words. variety shows thoughtfulness."
  * "these words could be about anyone. make it personal."
- Presents buttons: [submit anyway] [revise offering]
- 2-minute timeout

**If user clicks "submit anyway":**
- Shows "⟡ submitting offering ⟡"
- Proceeds to submission
- Posted to inner sanctum for voting

**If user clicks "revise":**
- Shows "⟡ wise choice ⟡" encouragement
- User must use `/gate6` again

---

### Scenario 3: All Caps (Warning)
**Input:**
```
IKA I LOVE YOU SO MUCH YOU ARE THE BEST IDOL EVER AND I WANT 
TO SUPPORT YOU FOREVER AND EVER AND NEVER LET YOU FADE AWAY
```

**Expected Behavior:**
- Score: ~10/100
- Quality: low
- Shows warning with concerns:
  * "this feels... repetitive. can you say more?"
  * "why are you yelling at me..."
- Presents confirmation dialog

---

### Scenario 4: Image Submission (Skip Quality Check)
**Input:**
```
Text: [empty or any text]
Attachment: fanart.png (image)
```

**Expected Behavior:**
- Quality check SKIPPED entirely
- No analysis performed
- Proceeds directly to submission
- Posted to inner sanctum for voting
- Rationale: Images are subjective, community decides

---

### Scenario 5: URL-Heavy (Warning)
**Input:**
```
Check out my offering https://very-long-url.com/path/to/thing 
and also https://another-url.com/more/stuff/here for Ika
```

**Expected Behavior:**
- Score: reduced by URL penalty
- If URLs >50% of content: -30 points
- Warning: "quantity isn't quality. put thought into it."
- Shows confirmation dialog

---

### Scenario 6: Medium Quality (Warning)
**Input:**
```
I really like Ika and think she deserves support. Her pink hair 
is pretty and I want to help prevent her from fading. The Chase 
seems hard but I believe in her ability to succeed.
```

**Expected Behavior:**
- Score: ~40-69/100
- Quality: medium
- Shows warning (even though it's not terrible)
- Gives user chance to improve before submission

---

## Button Interaction Tests

### Test: Timeout Behavior
1. Submit low-quality offering
2. See warning dialog
3. Wait 2 minutes without clicking
4. **Expected:** Shows "⟡ time expired ⟡"
5. User must use `/gate6` again

### Test: Submit Anyway
1. Submit low-quality offering
2. See warning dialog
3. Click "submit anyway"
4. **Expected:** 
   - Shows "⟡ submitting offering ⟡"
   - Buttons removed
   - Posted to inner sanctum
   - Success acknowledgment

### Test: Revise
1. Submit low-quality offering
2. See warning dialog
3. Click "revise offering"
4. **Expected:**
   - Shows "⟡ wise choice ⟡"
   - Encourages improvement
   - Buttons removed
   - Can resubmit via `/gate6`

---

## Edge Cases

### Already Completed Gate 6
- Quality check not reached
- Shows "already offered" message

### Pending Offering Exists
- Quality check not reached
- Shows "awaiting judgment" message

### Text Under 50 Words
- Quality check not reached
- Fails basic validation first
- Shows "too short" error

### Empty Text with No Image
- Quality check not reached
- Fails basic validation
- Shows error

---

## Integration Points

### Database
- `offeringOps.create()` - Only called after quality check (or skip)
- No database changes during warning dialog
- Submission only happens after user confirms

### Discord API
- `ButtonBuilder` - Creates interactive buttons
- `ActionRowBuilder` - Holds button components
- `createMessageComponentCollector` - Handles button clicks
- 2-minute timeout on collector

### Channels
- Inner Sanctum: Voting posts
- Offerings Archive: All submissions logged
- Chamber 6: Success announcements

---

## Quality Scoring Breakdown

| Factor | Threshold | Points | Warning |
|--------|-----------|--------|---------|
| **Unique words** | < 15 | -20 | "repetitive" |
| **Unique words** | > 40 | +20 | None |
| **Repeated word %** | > 20% | -25 | "variety shows thoughtfulness" |
| **Generic phrases** | ≥ 3 | -15 | "make it personal" |
| **All caps** | Yes | -20 | "why are you yelling" |
| **Exclamations** | > 10 | -10 | "so many exclamation marks" |
| **URL ratio** | > 50% | -30 | "quantity isn't quality" |

**Base Score:** 50 points
**Range:** 0-100
**Thresholds:**
- Low: < 40
- Medium: 40-70
- High: 70+

---

## Monitoring

**Console Logs to Watch:**
```
✧ [username] submitted Gate 6 offering
Gate 6 error: [if errors occur]
```

**Expected Log Flow (Low Quality):**
1. User runs `/gate6` with low-quality text
2. Quality check triggers
3. User sees warning dialog
4. User clicks "submit anyway"
5. Console: "✧ [username] submitted Gate 6 offering"
6. Message posted to inner sanctum

---

## Rollback Plan

If issues occur, revert these commits:
1. `/tmp/vibing/src/utils/validation.js` - Remove `analyzeOfferingQuality()` and export
2. `/tmp/vibing/src/gates/gate6.js` - Remove quality check block and restore original flow

