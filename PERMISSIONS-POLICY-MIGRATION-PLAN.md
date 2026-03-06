# Feature-Policy to Permissions-Policy Migration Plan

## Executive Summary

This document outlines the migration plan for transitioning the web-platform-tests (WPT) repository from the deprecated Feature-Policy specification to the current Permissions-Policy specification. The Feature-Policy API and header format have been superseded by Permissions-Policy, which uses different syntax based on Structured Field Values (RFC 8941) and a different JavaScript API.

The migration involves:
- **68 files** in external directories requiring header syntax updates
- **~9 JavaScript files** requiring API migration from `document.featurePolicy` to `document.permissionsPolicy`
- **~93 files** to be deleted from `feature-policy/` directory
- **4 new historical test files** to be created for backwards compatibility verification

This migration ensures WPT accurately tests current web platform specifications while maintaining historical tests to verify that legacy APIs are properly deprecated.

---

## Goals and Non-Goals

### Goals

1. **Specification Compliance**: Update all tests to use the current Permissions-Policy specification syntax and APIs
2. **Clean Test Structure**: Reduce `feature-policy/` directory from ~97 files to 4 historical test files
3. **Comprehensive Coverage**: Ensure `permissions-policy/` directory maintains complete test coverage (~125+ tests)
4. **Historical Testing**: Create tests that verify legacy Feature-Policy API is properly removed/ignored
5. **External Test Updates**: Update all tests in external directories that still use Feature-Policy headers or APIs
6. **Upstream Contribution**: Structure changes for clean PR submission to WPT repository

### Non-Goals

1. Adding new Permissions-Policy feature tests (out of scope for this migration)
2. Modifying browser implementations of Permissions-Policy
3. Changing test behavior or expected outcomes (only syntax/API updates)
4. Migrating tests for features that have been entirely removed from specifications

---

## Current State

### Feature-Policy Directory (`feature-policy/`)

| Category | Count | Notes |
|----------|-------|-------|
| Total files | ~97 | To be reduced to 4 |
| Test HTML files | ~45 | Most to be deleted |
| Support files | ~35 | Most to be deleted |
| Header files | ~15 | All to be deleted |
| Resource files | ~2 | To be deleted |

### Permissions-Policy Directory (`permissions-policy/`)

| Category | Count | Notes |
|----------|-------|-------|
| Total files | ~125 | Conforming tests |
| Test coverage | Complete | Tests current spec |

### External Directories

| Category | Count | Directories |
|----------|-------|-------------|
| Files with Feature-Policy headers | ~68 | Various feature directories |
| Files using `document.featurePolicy` | ~9 | JavaScript test files |

---

## Migration Strategy

### Overview

The migration follows a phased approach to minimize risk and enable incremental review:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Migration Phases                              │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1: External Header Migrations          [68 files]        │
│     ↓                                                           │
│  Phase 2: External JS API Migrations          [~9 files]        │
│     ↓                                                           │
│  Phase 3: feature-policy/ Cleanup             [~93 deletions]   │
│     ↓                                                           │
│  Phase 4: Historical Test Creation            [4 new files]     │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 1: External Directory Header Migrations

**Scope**: 68 files across multiple feature directories

**Objective**: Convert all `Feature-Policy` HTTP headers to `Permissions-Policy` syntax

**Key Transformations**:
- Header name: `Feature-Policy` → `Permissions-Policy`
- Syntax: `feature origin-list` → `feature=(origin-list)`
- Origins: `'self'` → `self`, `'none'` → `()`
- Separators: `;` → `,`

### Phase 2: External Directory JS API Migrations

**Scope**: ~9 JavaScript files

**Objective**: Replace all `document.featurePolicy` references with `document.permissionsPolicy`

**Key Transformations**:
- API: `document.featurePolicy` → `document.permissionsPolicy`
- Methods: `allowsFeature()`, `features()`, `allowedFeatures()`, `getAllowlistForFeature()`

### Phase 3: feature-policy/ Directory Cleanup

**Scope**: ~93 files to delete

**Objective**: Remove obsolete Feature-Policy tests that are superseded by Permissions-Policy tests

**Exclusions**: Do not delete files that will be repurposed for historical testing

### Phase 4: Historical Test Creation

**Scope**: 4 new files

**Objective**: Create tests verifying legacy API removal and header behavior

**Files to Create**:
1. `historical.html` - Main test file
2. `historical.html.headers` - Header configuration
3. `historical-iframe.html` - Iframe test resource
4. `README.md` - Documentation redirect

---

## Detailed Migration Tasks

### Phase 1: External Header Migrations (68 files)

#### Task 1.1: Identify All Affected Files

Search for files containing `Feature-Policy` headers:

```
Affected directories (estimated):
- accelerometer/
- ambient-light/
- battery-status/
- bluetooth/
- gamepad/
- geolocation/
- gyroscope/
- magnetometer/
- orientation-sensor/
- payment-request/
- picture-in-picture/
- screen-capture/
- screen-orientation/
- usb/
- wake-lock/
- webmidi/
- webusb/
- webxr/
```

#### Task 1.2: Header Syntax Conversions

For each `.headers` file, apply these transformations:

| Original | Converted |
|----------|-----------|
| `Feature-Policy: fullscreen *` | `Permissions-Policy: fullscreen=*` |
| `Feature-Policy: fullscreen 'self'` | `Permissions-Policy: fullscreen=self` |
| `Feature-Policy: fullscreen 'none'` | `Permissions-Policy: fullscreen=()` |
| `Feature-Policy: fullscreen 'self' https://example.com` | `Permissions-Policy: fullscreen=(self "https://example.com")` |
| `Feature-Policy: a *; b 'self'` | `Permissions-Policy: a=*, b=self` |

#### Task 1.3: Update Inline Headers

For files with inline meta headers or server-generated headers, apply same transformations.

#### Task 1.4: Dependencies

- No dependencies on other phases
- Files can be updated in parallel
- Group by feature directory for logical PRs

---

### Phase 2: External JS API Migrations (~9 files)

#### Task 2.1: Identify Affected Files

Search for files containing `document.featurePolicy`:

```javascript
// Files to update (approximate):
- permissions-policy/permissions-policy-*.js (support files)
- Various feature test files using the API
```

#### Task 2.2: API Transformations

| Original | Converted |
|----------|-----------|
| `document.featurePolicy` | `document.permissionsPolicy` |
| `featurePolicy.allowsFeature('fullscreen')` | `permissionsPolicy.allowsFeature('fullscreen')` |
| `featurePolicy.features()` | `permissionsPolicy.features()` |
| `featurePolicy.allowedFeatures()` | `permissionsPolicy.allowedFeatures()` |
| `featurePolicy.getAllowlistForFeature('x')` | `permissionsPolicy.getAllowlistForFeature('x')` |

#### Task 2.3: Update Test Assertions

Ensure test assertions reference correct API:

```javascript
// Before
assert_true('featurePolicy' in document);

// After
assert_true('permissionsPolicy' in document);
```

#### Task 2.4: Dependencies

- Should be completed after Phase 1 header migrations
- Some files may require both header and JS updates

---

### Phase 3: feature-policy/ Directory Cleanup (~93 files)

#### Task 3.1: Identify Files for Deletion

Files to DELETE (all files except historical test files):

```
feature-policy/
├── *.html (test files - DELETE)
├── *.html.headers (header files - DELETE)
├── resources/ (DELETE entire directory)
├── reporting/ (DELETE entire directory)
├── experimental-features/ (DELETE entire directory)
└── idlharness.window.js (DELETE)
```

#### Task 3.2: Preserve Historical Test Location

Reserve these paths for Phase 4:
- `feature-policy/historical.html`
- `feature-policy/historical.html.headers`
- `feature-policy/historical-iframe.html`
- `feature-policy/README.md`

#### Task 3.3: Verify No External Dependencies

Before deletion, verify no other tests depend on:
- Support files in `feature-policy/resources/`
- Test utilities in `feature-policy/`
- Shared headers or configurations

#### Task 3.4: Dependencies

- Complete after Phases 1 and 2
- Verify `permissions-policy/` has equivalent coverage

---

### Phase 4: Historical Test Creation (4 files)

#### Task 4.1: Create historical.html

```html
<!DOCTYPE html>
<meta charset="utf-8">
<title>Feature-Policy Historical Tests</title>
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
<script>
// Test 1: document.featurePolicy should not exist
test(() => {
  assert_false('featurePolicy' in document,
    'document.featurePolicy should not be defined');
}, 'Legacy featurePolicy API is removed');

// Test 2: document.permissionsPolicy should exist
test(() => {
  assert_true('permissionsPolicy' in document,
    'document.permissionsPolicy should be defined');
}, 'permissionsPolicy API is available');

// Test 3: Feature-Policy header should be ignored
// (Tested via conflicting headers - see historical.html.headers)
test(() => {
  // If Feature-Policy: fullscreen 'none' was respected,
  // fullscreen would be disabled. But Permissions-Policy
  // enables it, so it should be allowed.
  const policy = document.permissionsPolicy;
  assert_true(policy.allowsFeature('fullscreen'),
    'Feature-Policy header should be ignored in favor of Permissions-Policy');
}, 'Feature-Policy header is ignored');
</script>
```

#### Task 4.2: Create historical.html.headers

```
Feature-Policy: fullscreen 'none'
Permissions-Policy: fullscreen=*
```

This creates a conflict where:
- Feature-Policy says fullscreen is disabled
- Permissions-Policy says fullscreen is enabled
- Test verifies Permissions-Policy wins (Feature-Policy ignored)

#### Task 4.3: Create historical-iframe.html

```html
<!DOCTYPE html>
<meta charset="utf-8">
<title>Historical Iframe Resource</title>
<script>
// Resource for iframe allow attribute testing
window.parent.postMessage({
  featurePolicyExists: 'featurePolicy' in document,
  permissionsPolicyExists: 'permissionsPolicy' in document
}, '*');
</script>
```

#### Task 4.4: Create README.md

```markdown
# Feature-Policy Tests (Historical)

⚠️ **Feature-Policy has been superseded by Permissions-Policy**

The Feature-Policy specification has been renamed and updated to 
Permissions-Policy. All active tests have been moved to:

**[../permissions-policy/](../permissions-policy/)**

## Files in this Directory

The remaining files in this directory are **historical tests** that verify:

1. The legacy `document.featurePolicy` JavaScript API has been removed
2. The `Feature-Policy` HTTP header is ignored by browsers
3. Only `Permissions-Policy` header and `document.permissionsPolicy` API are active

## References

- [Permissions-Policy Specification](https://w3c.github.io/webappsec-permissions-policy/)
- [Permissions-Policy Tests](../permissions-policy/)
```

#### Task 4.5: Dependencies

- Complete after Phase 3 cleanup
- Can be developed in parallel and merged after deletions

---

## Header Syntax Conversion Reference

### Quick Reference Table

| Feature-Policy | Permissions-Policy | Notes |
|---------------|-------------------|-------|
| `Feature-Policy:` | `Permissions-Policy:` | Header name |
| `fullscreen *` | `fullscreen=*` | Allow all |
| `fullscreen 'self'` | `fullscreen=self` | Self token (no quotes) |
| `fullscreen 'none'` | `fullscreen=()` | Empty list = none |
| `fullscreen https://a.com` | `fullscreen="https://a.com"` | Origin in quotes |
| `fullscreen 'self' https://a.com` | `fullscreen=(self "https://a.com")` | Multiple in parens |
| `a *; b 'self'` | `a=*, b=self` | Comma separator |
| `a 'self'; b https://x.com https://y.com` | `a=self, b=("https://x.com" "https://y.com")` | Complex |

### Structured Field Values Format (RFC 8941)

Permissions-Policy uses Structured Field Values:

- **Tokens**: Unquoted identifiers like `self`, `*`
- **Strings**: Double-quoted values like `"https://example.com"`
- **Lists**: Parentheses with space-separated items `(self "https://a.com")`
- **Parameters**: Key=value pairs separated by commas

### Common Patterns

```
# Allow for all origins
Feature-Policy: fullscreen *
Permissions-Policy: fullscreen=*

# Allow for same origin only
Feature-Policy: fullscreen 'self'
Permissions-Policy: fullscreen=self

# Disable entirely
Feature-Policy: fullscreen 'none'
Permissions-Policy: fullscreen=()

# Allow for specific origin
Feature-Policy: fullscreen https://trusted.example
Permissions-Policy: fullscreen="https://trusted.example"

# Allow for self and specific origin
Feature-Policy: fullscreen 'self' https://trusted.example
Permissions-Policy: fullscreen=(self "https://trusted.example")

# Multiple features
Feature-Policy: fullscreen 'self'; geolocation 'none'; camera *
Permissions-Policy: fullscreen=self, geolocation=(), camera=*
```

---

## JavaScript API Conversion Reference

### API Mapping

| Feature-Policy API | Permissions-Policy API |
|-------------------|----------------------|
| `document.featurePolicy` | `document.permissionsPolicy` |
| `element.featurePolicy` | `element.permissionsPolicy` |

### Method Reference

All methods remain the same, only the object name changes:

```javascript
// Feature detection
// Before: 'featurePolicy' in document
// After:  'permissionsPolicy' in document

// Check if feature is allowed
// Before: document.featurePolicy.allowsFeature('fullscreen')
// After:  document.permissionsPolicy.allowsFeature('fullscreen')

// Check with origin parameter
// Before: document.featurePolicy.allowsFeature('fullscreen', 'https://example.com')
// After:  document.permissionsPolicy.allowsFeature('fullscreen', 'https://example.com')

// Get all supported features
// Before: document.featurePolicy.features()
// After:  document.permissionsPolicy.features()

// Get allowed features for current context
// Before: document.featurePolicy.allowedFeatures()
// After:  document.permissionsPolicy.allowedFeatures()

// Get allowlist for specific feature
// Before: document.featurePolicy.getAllowlistForFeature('fullscreen')
// After:  document.permissionsPolicy.getAllowlistForFeature('fullscreen')
```

### Semantic Changes

**Important**: Permissions-Policy uses AND semantics for allow attribute:

- **Feature-Policy (OR)**: Feature allowed if EITHER header OR allow attribute permits
- **Permissions-Policy (AND)**: Feature allowed only if BOTH header AND allow attribute permit

This affects tests checking iframe behavior with `allow` attribute.

---

## Testing Strategy

### Pre-Migration Verification

1. **Run existing tests** to establish baseline
   ```bash
   ./wpt run feature-policy/
   ./wpt run permissions-policy/
   ```

2. **Document current pass/fail status** for comparison

### During Migration

1. **Incremental testing** after each file modification
2. **Run affected feature tests** after header changes
3. **Verify no regressions** in `permissions-policy/` tests

### Post-Migration Verification

1. **Run full test suite** for affected directories
2. **Verify historical tests pass** (Feature-Policy ignored)
3. **Cross-browser testing** on major browsers:
   - Chrome/Chromium
   - Firefox
   - Safari
   - Edge

### Test Commands

```bash
# Run specific directory tests
./wpt run permissions-policy/

# Run historical tests
./wpt run feature-policy/historical.html

# Run with specific browser
./wpt run --product chrome permissions-policy/

# Run affected external tests
./wpt run accelerometer/
./wpt run geolocation/
# ... etc for each affected directory
```

---

## Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing tests | Test failures in CI | Incremental migration with testing after each change |
| Incorrect syntax conversion | Invalid headers | Use conversion reference; validate with browser devtools |
| Missing file updates | Inconsistent test suite | Comprehensive file search before marking complete |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser compatibility | Tests fail on some browsers | Cross-browser testing before PR submission |
| Semantic changes (AND vs OR) | Unexpected test behavior | Document and review tests using iframe allow attribute |
| External dependencies | Breaking other tests | Search for imports/references before deletion |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Merge conflicts | PR delays | Keep PRs small and focused |
| Review delays | Timeline extension | Clear PR descriptions and atomic changes |

---

## WPT Submission Strategy

### Recommended PR Structure

Break the migration into multiple focused PRs for easier review:

#### PR 1: External Header Migrations (Part 1)
- **Scope**: ~20-25 files in sensor-related directories
- **Directories**: accelerometer/, gyroscope/, magnetometer/, orientation-sensor/
- **Type**: Header syntax updates only

#### PR 2: External Header Migrations (Part 2)
- **Scope**: ~20-25 files in media-related directories
- **Directories**: picture-in-picture/, screen-capture/, screen-orientation/
- **Type**: Header syntax updates only

#### PR 3: External Header Migrations (Part 3)
- **Scope**: ~20-25 files in remaining directories
- **Directories**: geolocation/, payment-request/, bluetooth/, etc.
- **Type**: Header syntax updates only

#### PR 4: JavaScript API Migrations
- **Scope**: ~9 files
- **Type**: JS API updates (`featurePolicy` → `permissionsPolicy`)

#### PR 5: feature-policy/ Cleanup
- **Scope**: ~93 file deletions
- **Type**: File deletions only
- **Note**: Large PR, but simple (deletions only)

#### PR 6: Historical Tests
- **Scope**: 4 new files
- **Type**: New test additions
- **Depends on**: PR 5 merged first

### PR Ordering

```
PR 1 ─┬─→ PR 4 ──→ PR 5 ──→ PR 6
PR 2 ─┤
PR 3 ─┘
```

- PRs 1-3 can be submitted in parallel
- PR 4 can be submitted after PRs 1-3 or in parallel
- PR 5 should wait until PRs 1-4 are merged
- PR 6 depends on PR 5

### PR Metadata Requirements

Each PR should include:

1. **Title**: Clear, descriptive title
   - Example: `[Feature-Policy→Permissions-Policy] Update sensor directory headers`

2. **Description**:
   - Link to this migration plan
   - List of affected files
   - Summary of changes
   - Testing performed

3. **Labels**:
   - `permissions-policy`
   - `infra` (for cleanup PRs)

4. **Reviewers**:
   - Request review from permissions-policy spec editors
   - CC relevant feature directory owners

### Example PR Description

```markdown
## Summary

This PR updates Feature-Policy headers to Permissions-Policy syntax in the 
accelerometer/ directory as part of the broader migration effort.

## Changes

- Updated 5 .headers files with new Permissions-Policy syntax
- Converted `Feature-Policy: accelerometer 'self'` to `Permissions-Policy: accelerometer=self`

## Testing

- Ran `./wpt run accelerometer/` - all tests pass
- Verified headers in browser devtools

## Related

- Migration plan: [link]
- Spec: https://w3c.github.io/webappsec-permissions-policy/
```

---

## Timeline Estimate

**Note**: Estimates provided as relative complexity, not time duration.

| Phase | Complexity | Dependencies |
|-------|------------|--------------|
| Phase 1: External Headers | Medium (68 files, mechanical changes) | None |
| Phase 2: JS API | Low (~9 files, simple replacements) | None |
| Phase 3: Cleanup | Low (~93 deletions, verification needed) | Phases 1-2 |
| Phase 4: Historical Tests | Low (4 new files) | Phase 3 |

### Recommended Execution Order

1. **Start with Phase 1** - Can begin immediately, largest scope
2. **Phase 2 in parallel** - Independent of Phase 1
3. **Phase 3 after 1-2 merged** - Ensures no broken references
4. **Phase 4 last** - Clean slate for historical tests

---

## Appendix: File Lists

### External Files Requiring Header Updates (Approximate)

```
accelerometer/*.headers
ambient-light/*.headers
battery-status/*.headers
bluetooth/*.headers
gamepad/*.headers
geolocation/*.headers
gyroscope/*.headers
magnetometer/*.headers
orientation-sensor/*.headers
payment-request/*.headers
picture-in-picture/*.headers
screen-capture/*.headers
screen-orientation/*.headers
wake-lock/*.headers
webmidi/*.headers
webusb/*.headers
webxr/*.headers
```

### Files Requiring JS API Updates (Approximate)

```
**/permissions-policy*.js
**/feature-policy*.js (to be migrated or deleted)
```

### feature-policy/ Files to Delete

All files except:
- `historical.html` (to be created)
- `historical.html.headers` (to be created)
- `historical-iframe.html` (to be created)
- `README.md` (to be created)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-06 | Migration Team | Initial version |

---

*This document serves as the authoritative migration plan for the Feature-Policy to Permissions-Policy transition in the web-platform-tests repository.*
