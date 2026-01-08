# Discord.js Enhancement Implementation Plan

## Overview

This plan outlines improvements to the Seven Gates Discord bot using advanced Discord.js v14 features to enhance user experience, interactivity, and visual presentation.

---

## Phase 1: Component Infrastructure (Priority: HIGH)

### 1.1 RitualButtonBuilder
Create a themed button builder matching gate aesthetics.

**File:** `src/ui/builders/ritualButton.js`

**Features:**
- Gate-themed button styles (colors, emojis)
- Preset buttons: Continue, Confirm, Cancel, Navigate
- Disabled state styling
- Automatic custom ID generation with prefixes

### 1.2 RitualSelectMenuBuilder
Create themed dropdown menus.

**File:** `src/ui/builders/ritualSelect.js`

**Features:**
- Category selection (lore, mysteries, gates)
- Paginated option lists
- Themed placeholder text
- Multi-select for applicable scenarios

### 1.3 RitualModalBuilder
Create themed modal popups for text input.

**File:** `src/ui/builders/ritualModal.js`

**Features:**
- Gate-specific modal titles
- Pre-filled hints in text inputs
- Character limit indicators
- Multi-field modals for complex submissions

---

## Phase 2: Enhanced Embed Features (Priority: HIGH)

### 2.1 Author/Footer Enhancements
Update RitualEmbedBuilder with:

- `setIkaAuthor()` - Adds Ika as author with avatar
- Dynamic footer generators based on time/mood
- Gate icon thumbnails

### 2.2 Inline Field Layouts
Add preset layouts:

- `addStatsLayout(stats)` - 3-column stat display
- `addProgressLayout(current, total)` - Visual progress
- `addTimestampLayout(dates)` - Multiple timestamps

### 2.3 Image Integration
- Gate completion images
- Ascension celebration images
- Error state images

---

## Phase 3: Interactive Improvements (Priority: MEDIUM)

### 3.1 Paginated Embeds
**File:** `src/ui/builders/paginatedEmbed.js`

- Previous/Next navigation
- Page indicators
- Jump-to-page dropdown
- Timeout handling

### 3.2 Confirmation Flows
Replace immediate actions with confirmations:

- `/admin reset` → Confirm button
- `/offering` → Preview + Confirm
- `/binding` → Modal + Preview + Confirm

### 3.3 Share/Private Toggle
Add buttons to share ephemeral content publicly:

- Journey progress sharing
- Achievement celebrations
- Mystery discoveries

---

## Phase 4: Gate-Specific Enhancements (Priority: MEDIUM)

### 4.1 Gate 3 (Confession) Modal
Replace text option with modal:
- Large text area for confession
- Preview before posting
- Edit capability

### 4.2 Gate 6 (Offering) Workflow
Enhanced submission flow:
- Type selection buttons
- Description modal
- Preview embed
- Submit/Edit buttons

### 4.3 Gate 7 (Binding) Ceremony
Modal-based vow:
- Ceremonial modal title
- Multi-line vow input
- Dramatic preview
- Confirmation with gravity

---

## Phase 5: Admin Panel Improvements (Priority: LOW)

### 5.1 Interactive Inspection
- Tabbed user inspection (buttons)
- Live state updates
- One-click actions

### 5.2 Batch Operations
- Multi-select users
- Bulk advancement
- Broadcast with preview

---

## Implementation Order

1. **RitualButtonBuilder** - Foundation for all interactive features
2. **Author/Footer Enhancements** - Quick wins for visual improvement
3. **Confirmation Flows** - Better UX for destructive actions
4. **PaginatedEmbed** - Essential for content browsing
5. **Gate Modals** - Enhanced submission experiences
6. **Image Integration** - Visual polish

---

## File Changes Summary

### New Files:
- `src/ui/builders/ritualButton.js`
- `src/ui/builders/ritualSelect.js`
- `src/ui/builders/ritualModal.js`
- `src/ui/builders/paginatedEmbed.js`
- `src/ui/builders/confirmationFlow.js`

### Modified Files:
- `src/ui/builders/ritualEmbed.js` - Add author/footer methods
- `src/ui/index.js` - Export new builders
- `src/commands/binding.js` - Use modal
- `src/commands/journey.js` - Add share button
- `src/events/interactionCreate.js` - Handle new component types

---

## Success Metrics

- Reduced user confusion (fewer support questions)
- Increased engagement (more public celebrations)
- Faster testing (admin improvements)
- Consistent visual theme across all interactions
