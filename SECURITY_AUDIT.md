# Security & Bug Audit Report

**Project:** Seven Gates Discord Bot
**Date:** 2026-01-08
**Auditor:** Claude Code
**Version Audited:** v4.1.0

---

## Executive Summary

The Seven Gates Discord Bot codebase demonstrates **strong security practices** overall. The development team has implemented several key security measures including SQL injection protection, SSRF prevention, rate limiting, and proper secrets management. However, there are a few areas that warrant attention.

**Overall Security Rating: B+ (Good)**

| Category | Status |
|----------|--------|
| Secrets Management | ✅ Excellent |
| SQL Injection Protection | ✅ Good |
| SSRF Protection | ✅ Good |
| Rate Limiting | ✅ Implemented |
| Input Validation | ✅ Good |
| Authorization | ✅ Good |
| Dependencies | ⚠️ Review Recommended |

---

## Phase 1: Reconnaissance Summary

### Tech Stack
- **Runtime:** Node.js with Bun package manager
- **Framework:** discord.js v14.25.1
- **Database:** SQLite via better-sqlite3 v9.6.0
- **AI Integration:** @anthropic-ai/sdk v0.17.2
- **Configuration:** dotenv v16.6.1

### Entry Points Identified
- `messageCreate` event - Handles user messages
- `interactionCreate` event - Handles slash commands
- `guildMemberAdd` event - New member joins
- `guildCreate` event - Bot joins server
- `ready` event - Bot initialization

### Key Attack Surfaces
1. User input via slash commands (15+ commands)
2. Message content processing
3. URL validation (Gate 3 confession)
4. File uploads (Gate 6 offerings)
5. AI prompt injection (Claude API integration)

---

## Phase 2: Security Vulnerability Assessment

### Critical Issues
**None found** - No hardcoded secrets, credentials, or critical vulnerabilities detected.

### High Severity Issues
**None found** - No SQL injection, command injection, or code execution risks identified.

### Medium Severity Issues

#### 1. Potential SQL Injection in Archival System
**File:** `src/utils/archival.js:316`
**Risk:** Medium
**Description:** The `compactMemoryArrays` function constructs SQL column names from JSON object keys without validation against the allowlist.

```javascript
const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
```

**Mitigation:** This is partially mitigated because:
- Data originates from the same application (stored JSON)
- Keys are derived from hardcoded field names in the function itself
- However, add explicit validation against `ALLOWED_MEMORY_COLUMNS` for defense-in-depth.

#### 2. Missing JSON.parse Error Handling
**Files:** Multiple files across codebase
**Risk:** Medium
**Description:** Several `JSON.parse()` calls lack try-catch wrappers, which could cause crashes if malformed JSON is stored in the database.

**Affected areas:**
- `src/ika/betrayal.js:497`
- `src/ika/collective.js:317`
- `src/ika/investigation.js:212, 241, 260`
- `src/ika/shrine.js:232`
- `src/ika/trials.js:277, 310, 370, 405, 518`
- `src/commands/adminPanel.js:768-769`

**Mitigation:** Wrap JSON.parse calls in try-catch blocks with fallback defaults.

### Low Severity Issues

#### 1. In-Memory Rate Limiting Data Loss
**File:** `src/utils/optimization.js`
**Risk:** Low
**Description:** Rate limiting data stored in Map objects is lost on restart. A dedicated attacker could exploit server restarts to bypass rate limits.

**Mitigation:** Consider persisting rate limit state to database for critical limits, or accept as known limitation.

#### 2. Test Mode Not Persisted
**File:** `src/commands/admin.js:239`
**Risk:** Low
**Description:** Test mode toggle modifies runtime config but doesn't persist across restarts.

```javascript
config.testMode = enabled; // Lost on restart
```

**Mitigation:** Document this behavior or add persistence mechanism.

#### 3. Temporary File Cleanup Race Condition
**File:** `src/ika/handwriting.js:277-299`
**Risk:** Low
**Description:** Temporary files use timestamp-based names. While not directly exploitable, there's a theoretical race condition window.

**Mitigation:** Use `crypto.randomUUID()` for temp file names.

---

## Phase 3: Bug & Code Quality Assessment

### Good Practices Observed

1. **SQL Injection Protection** - Column allowlists in `database.js`:
   - `ALLOWED_USER_COLUMNS`
   - `ALLOWED_MEMORY_COLUMNS`
   - `isValidColumn()` validation function

2. **SSRF Protection** - Comprehensive blocked URL patterns in `validation.js`:
   - Localhost/127.x.x.x blocked
   - Private IP ranges blocked (10.x, 172.16-31.x, 192.168.x)
   - IPv6 localhost blocked
   - Dangerous protocols blocked (file:, javascript:, data:)
   - Internal hostnames blocked

3. **Input Sanitization** - Discord mention escaping:
   ```javascript
   input.replace(/@everyone/gi, '@\u200beveryone')
        .replace(/@here/gi, '@\u200bhere')
        .slice(0, 2000);
   ```

4. **Rate Limiting System** - Multi-tier rate limiting:
   - Per-user limits based on trust tier
   - Per-channel limits
   - Global API rate limits
   - Spam detection with pattern matching

5. **Authorization Checks** - Admin commands properly gated:
   ```javascript
   if (!hasRole(interaction.member, config.roles.mod)) {
       return interaction.reply({ embeds: [embed], ephemeral: true });
   }
   ```

### Potential Bugs

#### 1. Missing Canvas Dependency
**File:** `src/ika/handwriting.js:16`
**Issue:** The `canvas` package is imported but not listed in `package.json` dependencies.

```javascript
const { createCanvas, registerFont } = require('canvas');
```

**Impact:** Handwritten notes feature may fail if canvas isn't installed.

#### 2. Regex DoS Risk Assessment
**Result:** Safe - All regex patterns in `validation.js` are bounded and don't exhibit catastrophic backtracking.

---

## Phase 4: Dependency Audit

### Dependencies Analysis

| Package | Version | Latest | Status |
|---------|---------|--------|--------|
| @anthropic-ai/sdk | ^0.17.1 | 0.17.2 | ✅ Up to date |
| better-sqlite3 | ^9.4.3 | 9.6.0 | ⚠️ Minor update available |
| discord.js | ^14.14.1 | 14.25.1 | ⚠️ Minor updates available |
| dotenv | ^16.4.1 | 16.6.1 | ⚠️ Minor update available |

### Recommendations
1. Run `bun update` to get latest patch versions
2. No known critical CVEs in current dependencies
3. Consider pinning exact versions for production stability

### Missing Dependencies
- `canvas` - Required for handwriting.js but not in package.json

---

## Top 5 Priority Items to Fix

### Priority 1: Add JSON.parse Error Handling
**Effort:** Low | **Impact:** Medium
Add try-catch blocks around JSON.parse calls to prevent crashes from malformed data.

```javascript
// Before
const data = JSON.parse(memory.remembered_facts);

// After
let data = [];
try {
    data = JSON.parse(memory.remembered_facts || '[]');
} catch (e) {
    console.error('Failed to parse remembered_facts:', e);
    data = [];
}
```

### Priority 2: Add Canvas to Dependencies
**Effort:** Low | **Impact:** Low
Add the canvas package to package.json:

```bash
bun add canvas
```

### Priority 3: Validate Archival SQL Column Names
**Effort:** Low | **Impact:** Medium
Add allowlist validation in `compactMemoryArrays`:

```javascript
// In archival.js, validate keys before SQL construction
for (const key of Object.keys(updates)) {
    if (!ALLOWED_MEMORY_COLUMNS.has(key)) {
        console.error(`Security: Invalid column in archival: ${key}`);
        delete updates[key];
    }
}
```

### Priority 4: Update Dependencies
**Effort:** Low | **Impact:** Low
Run dependency updates to get latest patches:

```bash
bun update
```

### Priority 5: Document Rate Limiting Limitations
**Effort:** Low | **Impact:** Low
Add documentation noting that rate limits reset on bot restart. Consider if this is acceptable for your threat model.

---

## Security Checklist Summary

| Check | Status |
|-------|--------|
| No hardcoded secrets | ✅ Pass |
| Secrets in environment variables | ✅ Pass |
| SQL injection protection | ✅ Pass |
| SSRF protection | ✅ Pass |
| Command injection prevention | ✅ Pass |
| XSS in Discord (mention escaping) | ✅ Pass |
| Rate limiting | ✅ Pass |
| Authorization checks | ✅ Pass |
| Input validation | ✅ Pass |
| Error handling | ⚠️ Partial |
| Dependency security | ✅ Pass |

---

## Conclusion

The Seven Gates Discord Bot codebase is **well-secured** for its intended purpose. The development team has proactively implemented security measures including SQL injection prevention, SSRF protection, and comprehensive rate limiting.

The identified issues are primarily **medium-to-low severity** and relate to defensive coding practices rather than exploitable vulnerabilities. The top priority fixes are straightforward and should take minimal development time.

**No critical or high-severity vulnerabilities were identified.**

---

*Report generated by Claude Code Security Audit*
