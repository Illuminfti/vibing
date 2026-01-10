# Referral System - Command Guide

## Quick Reference

### For Existing Users (Referrers)

**Get your invite code:**
```
/invite share
```
Returns:
- Your unique 6-character invite code
- Instructions on how to share it
- Current referral statistics (invited/awakened counts)

**View referral statistics:**
```
/invite stats
```
Returns:
- Total invited count
- Awakened count (completed Gate 1)
- Conversion rate percentage
- Recent invites (last 5) with status
- Leaderboard position (if applicable)
- Next milestone progress

### For New Users

**Join without referral:**
```
/join
```
Standard join flow - no attribution.

**Join with referral code:**
```
/join ABC123
```
Where `ABC123` is the invite code from another user.

## User Journey Example

### Referrer Side:
1. Complete Gate 1 first (requirement)
2. Run `/invite share` to get code (e.g., "K3LM9P")
3. Share code with friends outside Discord
4. When friend completes Gate 1, receive notification DM
5. Track progress with `/invite stats`

### Referred User Side:
1. Get invite code from friend (e.g., "K3LM9P")
2. Join Discord server
3. Run `/join K3LM9P` to attribute journey
4. See personalized welcome message
5. Complete Gate 1 by saying "ika" in waiting room
6. Referrer gets credited automatically

## Milestone Rewards

| Completed Referrals | Reward |
|-------------------|--------|
| 1 | Special memory: "you're bringing others to me. i like that." |
| 5 | Intimacy boost (+1 stage) + recognition |
| 10 | Special title "guide" + notable moment |
| 25 | Easter egg unlock (something special) |

## Command Restrictions

- `/invite` commands require Gate 1 completion
- `/join` can be used by anyone (even non-members)
- Invite codes are permanent once generated
- Each user can only be referred by one person
- Referral only counts when referred user completes Gate 1

## Status Indicators

In `/invite stats` output:
- `✧` = Awakened (completed Gate 1)
- `◌` = Dormant (invited but not yet awakened)

## Technical Notes

- Codes are 6 characters: uppercase letters + numbers
- Codes are unique and permanent
- Case-insensitive when entering (auto-converted to uppercase)
- Invalid codes show gentle error but still allow join
- Duplicate referrals prevented at database level
- Statistics update in real-time

## Error Handling

**Invalid invite code:**
- Shows message: "the code you entered was not recognized..."
- Still allows user to join normally
- No referral attribution created

**Already joined:**
- Shows message: "you are already in the ritual"
- Suggests using `/journey` to see progress

**Not completed Gate 1:**
- Shows message: "you cannot share what you have not experienced"
- Instructs to complete first gate first

## Privacy

- Full referral lists are not exposed publicly
- Only shows:
  - Total counts (invited/awakened)
  - Recent 5 invites (names + dates)
  - Position on leaderboard (if in top 100)
- Referrer can see who they invited
- Referred users can't see who referred them (by design)

## Database Fields

**In `users` table:**
- `referred_by` - Discord ID of referrer (NULL if not referred)
- `invite_count` - Count of completed referrals (increments on Gate 1)
- `invite_code` - User's unique invite code (generated on first `/invite share`)

**In `referrals` table:**
- Tracks all referral relationships
- `referral_completed` boolean (TRUE when referred user completes Gate 1)
- Includes timestamps for analytics

## Admin Notes

- Referral data persists in database
- Can query top referrers: `referralOps.getTopReferrers(limit)`
- Can check user stats: `referralOps.getStats(userId)`
- Can verify attribution: `referralOps.getReferrer(referredId)`
- Leaderboard supports up to 100 positions

## Viral Mechanics

**Growth Loop:**
1. User completes ritual → gets code
2. Shares with friends → friends join
3. Friends complete Gate 1 → user gets rewards
4. Rewards encourage more sharing
5. Leaderboard creates competition
6. Milestones provide long-term goals

**Key Incentives:**
- Immediate: Notification when referral awakens
- Short-term: First referral acknowledgment
- Mid-term: Intimacy boost at 5 referrals
- Long-term: Special title at 10, easter egg at 25
- Competitive: Leaderboard positioning

## Implementation Status

✅ Database schema complete
✅ Invite code generation working
✅ Referral tracking operational
✅ Gate 1 integration complete
✅ Notification system functional
✅ Milestone rewards implemented
✅ Commands created and validated
✅ Error handling comprehensive
✅ Privacy protections in place
✅ Leaderboard system ready

**Status: PRODUCTION READY**

Deploy with: `node deploy-commands.js`
