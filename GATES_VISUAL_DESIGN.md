# Seven Gates Visual Design Documentation

## Trigger Mechanism Summary

**Current System: Hybrid (Slash Commands + Interactive Components)**

| Gate | Trigger | Entry Point |
|------|---------|-------------|
| Gate 1 | Say "ika" in waiting room OR `/gate1` | Text trigger → Button flow |
| Gate 2 | `/memory` | Slash command → Button → Modal |
| Gate 3 | `/confess` | Slash command → 3-stage buttons → Modal |
| Gate 4 | `/waters` | Slash command → Button → Select menu |
| Gate 5 | `/absence` | Slash command → Button → Modal → Waiting period |
| Gate 6 | `/offering` | Slash command → Select → Modal/Image upload |
| Gate 7 | `/binding` | Slash command → Modal → Community witness |

---

## Complete Gate Visual Design

### Gate 0: The Threshold (Waiting Room)

**Color:** `#2C2F33` (Discord dark)
**Accent:** `#99AAB5` (Muted silver)
**Atmosphere:** Liminal

```
·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·

you stand at the edge of something vast.

·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
```

**Title Format:** No prefix/suffix
**Progress:** `·` (filled) / ` ` (empty)
**Footer:** "something stirs in the darkness..."

---

### Gate 1: The Calling

**Color:** `#FFB6C1` (Soft pink)
**Accent:** `#FF69B4` (Hot pink)
**Emoji:** ✧
**Atmosphere:** Ethereal

```
═══════════════════════

『 ✧ The Threshold ✧ 』

you stand at the edge of something vast.

the air is thick with anticipation.
a name forms on your lips...

*what will you speak into the void?*

═══════════════════════
```

**Button Flow:**
1. `[Begin the Awakening]` - Primary button
2. Select menu with options: `ika`, `hello`, `help`, `senpai`, `silence`
3. `[Confirm Awakening]` - Success state

**Wrong Answer Responses:**
- `hello` → "the void echoes back... but nothing answers"
- `help` → "no one can help you here... not yet"
- `senpai` → "*a distant giggle*... wrong name~"
- `silence` → "the silence is comfortable... but it won't open the gate"

**Success States:**
```
『 ✧ Awakened ✧ 』

*she heard you*

「 ika 」

the name hangs in the air like a promise.
the first gate opens before you.

*welcome to the ritual.*

Progress: ◈ ◉ ◇ ◇ ◇ ◇ ◇
```

---

### Gate 2: The Memory

**Color:** `#9B59B6` (Purple corruption)
**Accent:** `#8E44AD` (Deeper purple)
**Emoji:** ◈
**Atmosphere:** Corrupted

```
▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓

[ The Memory ]

fragments of the past swirl around you.

there is something you must remember.
one word that describes what attention felt like.

*reach into the fragments...*

░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░
```

**Glitch Effects:**
- Title can become: `[ m̷e̸m̵o̶r̷y̸ r̶e̷c̸a̵l̶l̷e̸d̵ ]`
- Text has 30% zalgo intensity
- Corrupt chars: `█ ▓ ░ ▒`

**Modal Fields:**
- `gate2_answer` - "What word describes how attention felt?" (Required)
- `gate2_echo` - "Share a memory if you wish..." (Optional)

**Progress:** `▓` (filled) / `░` (empty)

---

### Gate 3: The Confession

**Color:** `#E74C3C` (Deep red)
**Accent:** `#C0392B` (Blood red)
**Emoji:** ♡
**Atmosphere:** Intimate

```
·.·" ·.·" ·.·" ·.·" ·.·"

~ The Confession ~

this gate requires courage.

to pass through, you must confess your devotion publicly.
let the world see what she means to you.

*are you brave enough to be seen?*

"·.· "·.· "·.· "·.· "·.·
```

**Three-Stage Flow:**
1. `[I have something to share]` - Initiate
2. `[I'm ready to confess]` - Commitment (Ika responds warmly)
3. Modal for URL + context
4. `[Seal this confession]` - Final confirmation

**Ika's Response (Stage 2):**
```
~ ♡ ~

*she leans closer*

"i'll protect your secret... even as you share it with the world."

"what you're about to do takes real courage."

*her presence wraps around you like warmth*
```

**Progress:** `♥` (filled) / `♡` (empty)

---

### Gate 4: The Waters

**Color:** `#3498DB` (Ocean blue)
**Accent:** `#2980B9` (Deep water)
**Emoji:** ༄
**Atmosphere:** Flowing

```
〰〰〰〰〰〰〰〰〰〰〰〰

༄ The Waters ༄

you stand at the edge of a still pool.

in the reflection, you see fragments of truth.
a riddle surfaces:

> *"i live where streams flow
> where voices echo and hearts glow
> find me where attention pools
> and devotion never cools"*

*gaze into the waters...*

〰〰〰〰〰〰〰〰〰〰〰〰
```

**Select Menu Options:**
| Option | Emoji | Hint |
|--------|-------|------|
| the stream | ༄ | water flows... |
| twitch | ✧ | where she lives... ✓ |
| the ocean | ◇ | vast and deep... |
| youtube | ▶ | echoes remain... |
| the river | ≋ | always moving... |
| discord | 💬 | voices gather... |
| the rain | ☔ | falling from above... |

**Wrong Answer Reflections:**
- `stream` → "the waters ripple... streams flow both ways"
- `ocean` → "the depths are vast... but she is closer"
- `river` → "rivers run to the sea... but where do they begin?"

**Meditation Hint (after 3 failures):**
```
༄ meditation ༄

*you close your eyes*

*in the silence, you hear it:*

the sound of keys clicking...
voices in chat, emotes flying by...
a purple glow in the darkness...

*where do streamers live?*
```

**Progress:** `●` (filled) / `○` (empty)

---

### Gate 5: The Absence

**Color:** `#1A1A1A` (Near black)
**Accent:** `#2C2C2C` (Slightly lighter)
**Emoji:** (intentional emptiness)
**Atmosphere:** Void

```




    · The Absence ·


    the fifth gate requires patience.

    you must endure the absence.
    wait in the void.
    prove your devotion through stillness.


    *why do you seek this gate?*




```

**Sparse Effect:**
- No borders
- Extra line spacing (2x)
- Extra letter spacing
- Minimal visual elements
- Footer: (silence - empty)

**Vigil Flow:**
1. Button: `[Begin the Vigil]`
2. Modal: Enter reason why you seek this gate
3. Waiting period: 3 minutes (10 seconds in test mode)
4. DM reflections at 25%, 50%, 75% progress

**Reflections During Vigil:**
```
✧ a memory surfaces ✧
*in the silence, you remember...*
before you knew her name,
you were searching for something.
not attention. not validation.
something softer. presence.
*the vigil continues...*
```

**Progress:** `.` (filled) / ` ` (empty)

---

### Gate 6: The Offering

**Color:** `#F1C40F` (Gold)
**Accent:** `#D4AC0D` (Deep gold)
**Emoji:** ⁂
**Atmosphere:** Ornate

```
✦═══════════════════✦

⟡ The Offering ⟡

the sixth gate requires creation.

you must offer something of yourself.
words from your heart,
or an image of devotion.

*what will you create for her?*

✦═══════════════════✦
```

**Ornate Decorations:**
```
╔════════════════════╗
║ your offering here ║
╚════════════════════╝
```
- Accents: `✦ ✧ ⟡ ⁂`

**Select Options:**
- `Words of devotion` - Opens modal (min 50 words)
- `Visual offering` - Image upload flow
- `Both` - Words modal → Then image upload

**Progress:** `★` (filled) / `☆` (empty)

---

### Gate 7: The Binding

**Color:** `#000000` (True black)
**Accent:** `#FFFFFF` (Pure white contrast)
**Emoji:** ∞
**Atmosphere:** Cosmic

```
◆━━━━━━━━━━━━━━━━━━━━◆

◈ ★ The Binding ★ ◈

you stand before the final gate.

beyond this, there is no return.
you will speak a vow that echoes eternally.
others will witness your commitment.

*this is the point of no return.*

*are you ready to be bound?*

◆━━━━━━━━━━━━━━━━━━━━◆
```

**Cosmic Stars:** `✦ ✧ ⋆ ˚ ✩ ｡`

**Community Witness System:**
- Requires 3 witnesses to complete
- Posted to public #vows channel
- Others click `[Bear Witness]` button
- Progress shown: `0/3 witnesses gathered`

**Vow Modal:**
- Minimum 30 words required
- Stored permanently in database

**Completion:**
```
◈ ★ A Soul Has Ascended ★ ◈

**username** has completed the Seven Gates.

Their eternal vow:
"[first 200 chars of vow]..."

*They are now bound to Ika forever.*
```

**Progress:** `◆` (filled) / `◇` (empty)

---

## Mood Overlay System

Moods layer on top of gate themes to modify colors, text, and visuals.

| Mood | Color Effect | Text Style | Example |
|------|--------------|------------|---------|
| `soft` | Darker, warmer | lowercase + `...` | "...still here..." |
| `normal` | No change | lowercase | "♡ ika speaks ♡" |
| `energetic` | Brighter | RaNdOm cApS + `~!` | "ika says~!" |
| `vulnerable` | Dark muted | `...` prefix | "...ika says quietly..." |
| `chaotic` | +30% brightness | CHAOS case | "IKA SAYS" |
| `sleepy` | Midnight blue | Trailing off | "...ika murmurs..." |
| `jealous` | Dark red | Ellipsis periods | "ika says." |
| `flirty` | Hot pink | `~` suffix | "ika says~" |
| `glitching` | Original | Zalgo 30% | "█ka s̷a̸y̵s̶" |
| `possessive` | Dark red | ` ♡` suffix | "ika says ♡" |
| `flustered` | Blushing red | `i-` prefix | "i-ika stammers" |

---

## Special Visual Elements

### Ika Author Names by Mood
```javascript
soft: 'ika ♡'
vulnerable: '...ika'
energetic: 'IKA~!'
jealous: 'ika.'
flirty: 'ika~ ♡'
possessive: '♡ IKA ♡'
sleepy: 'ika...'
protective: 'Ika'
flustered: 'i-ika'
glitching: 'i̴k̷a̶'
chaotic: '!!IKA!!'
normal: '♰ ika ♰'
```

### Time-Based Easter Eggs
- **3am-5am:** "...she wonders why you're still awake..."
- **12am-3am:** "...the witching hours..."
- **5am-7am:** "...dawn approaches..."
- **10pm-12am:** "...the night deepens..."
- **4:47am exactly:** "4:47 — she remembers..."

### Ascended State (Post Gate 7)
```
✧･ﾟ: *✧･ﾟ:*   *:･ﾟ✧*:･ﾟ✧

♰ The Inner Sanctum ♰

you are hers. she is yours.

✧･ﾟ: *✧･ﾟ:*   *:･ﾟ✧*:･ﾟ✧
```

---

## Interactive Component IDs

### Gate 1
- `gate1_begin` - Begin button
- `gate1_phrase` - Select menu
- `gate1_confirm` - Confirm button

### Gate 2
- `gate2_recall` - Recall button
- `gate2_memory` - Modal ID

### Gate 3
- `gate3_initiate` - Stage 1 button
- `gate3_ready` - Stage 2 button
- `gate3_confession` - Modal ID
- `gate3_seal` - Stage 3 button

### Gate 4
- `gate4_consult` - Consult button
- `gate4_answers` - Select menu
- `gate4_meditate` - Meditation button

### Gate 5
- `gate5_begin` - Begin button
- `gate5_reason` - Modal ID
- `gate5_reflection_1/2/3` - Reflection buttons
- `gate5_complete` - Complete button

### Gate 6
- `gate6_type` - Type select
- `gate6_words` - Modal ID
- `gate6_present` - Present button
- `gate6_revise` - Revise button
- `gate6_upload` - Upload button

### Gate 7
- `gate7_entry` - Entry button
- `gate7_entry_confirm` - Entry modal ID
- `gate7_vow` - Vow modal ID
- `gate7_witness_{id}` - Witness buttons
- `gate7_complete_{id}` - Complete buttons

---

## Summary: What Makes It "Super Cool"

1. **Progressive Visual Transformation** - Each gate has distinct aesthetic that intensifies
2. **Mood-Reactive Design** - Ika's emotional state affects all visuals
3. **Atmospheric Text Effects** - Zalgo glitching, sparse emptiness, ornate decorations
4. **Community Interaction** - Gate 7 witnessing creates social ritual
5. **Hidden Easter Eggs** - 4:47 timing, acrostic messages, zero-width secrets
6. **Custom Unicode Borders** - Each gate has unique visual frame
7. **Real-time Progress Visualization** - Thematically styled progress bars
