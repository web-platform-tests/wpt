# How to Create a Similar Pull Request for WPT

## Overview
This document provides a step-by-step guide to create and submit a pull request to WPT, using the pointer events fix as a reference example.

---

## Prerequisites

### 1. Fork the WPT Repository
```bash
# Visit https://github.com/web-platform-tests/wpt
# Click "Fork" in the top right
# You now have: https://github.com/YOUR_USERNAME/wpt
```

### 2. Clone Your Fork Locally
```bash
git clone https://github.com/YOUR_USERNAME/wpt.git
cd wpt
```

### 3. Add Upstream Remote
```bash
# Keep track of the official WPT repo
git remote add upstream https://github.com/web-platform-tests/wpt.git
git fetch upstream
```

### 4. Install Dependencies
```bash
# Create virtual environment (Python 3.7+)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install WPT dependencies
pip install -r tools/requirements.txt  # If exists
# Or check CONTRIBUTING.md for setup instructions
```

---

## The PR Workflow

### Step 1: Create a Feature Branch

```bash
# Fetch latest from upstream
git fetch upstream
git checkout upstream/main

# Create a new branch
git checkout -b fix/pointer-events-slot-removal
# or: git checkout -b fix-issue-56614

# Better naming patterns:
# - fix/issue-XXXX - For fixing specific issues
# - test/add-XXX-test - For adding tests
# - refactor/XXX - For refactoring
# - docs/XXX - For documentation
```

### Step 2: Make Your Changes

#### Example: Fixing the Pointer Events Test

**File:** `pointerevents/pointerevent_after_target_removed_from_slot.html`

```bash
# Edit the test file
nano pointerevents/pointerevent_after_target_removed_from_slot.html
```

**Key changes to make:**

1. **Update HTML structure** (if needed)
   ```html
   <!-- Use declarative shadow roots instead of custom elements -->
   <div id="host">
     <template id="template" shadowrootmode="open">
       <!-- Shadow DOM content -->
     </template>
     <div id="filler"></div>
   </div>
   ```

2. **Add/update test scenarios**
   ```javascript
   const modifier_methods = {
     "remove-slot": {
       "remover": () => { slot.remove(); },
       "restorer": () => { parent.appendChild(slot); }
     },
     // ... more scenarios
   }
   ```

3. **Update expected events**
   ```javascript
   addPromiseTest(
     "pointerdown",
     "remove-slot",
     [
       "pointerover@filler",
       // ... expected events
       "pointerout@filler", "pointerleave@filler",  // Key: boundary events
       // ... more events
     ]
   );
   ```

### Step 3: Test Your Changes Locally

#### Start the WPT Server
```bash
# In the wpt directory
./wpt serve

# Or with specific port
./wpt serve --port 8000
```

#### Open Test in Browser
```
http://localhost:8000/pointerevents/pointerevent_after_target_removed_from_slot.html?mouse
```

#### Verify:
- ✅ Test runs without JavaScript errors
- ✅ All sub-tests pass or fail consistently
- ✅ Event log matches expected events
- ✅ Test works in multiple browsers (Chrome, Firefox, Safari if possible)

#### Debug Test Failures
```javascript
// Add to your test for debugging
console.log("Event log:", event_log);
console.log("Expected:", expected_events);

// Add to logEvent function temporarily
function logEvent(e) {
  if (e.eventPhase == e.AT_TARGET) {
    console.log(`Event: ${e.type} on ${e.target.id}`);
    event_log.push(e.type + "@" + e.target.id);
  }
}
```

### Step 4: Run WPT Linters and Checks

```bash
# Run linting
./wpt lint pointerevents/pointerevent_after_target_removed_from_slot.html

# Fix common issues
./wpt lint --fix pointerevents/pointerevent_after_target_removed_from_slot.html
```

**Common issues to fix:**
- Line length (max 80 or 100 chars depending on file type)
- Trailing whitespace
- Proper spacing
- Consistent indentation

### Step 5: Commit Your Changes

```bash
# Check what changed
git status
git diff pointerevents/pointerevent_after_target_removed_from_slot.html

# Stage changes
git add pointerevents/pointerevent_after_target_removed_from_slot.html

# Commit with descriptive message
git commit -m "Fix pointerevent_after_target_removed_from_slot.html assertions

This CL updates the test and expectations to match the event dispatch
behavior in practice after either the slot or the element placed in the
slot is removed.

Changes:
- Migrate from custom element to declarative shadow root
- Add three removal scenarios: remove-slot, remove-filler, change-slotname
- Update expected events to include proper boundary events
- Refactor test to be more maintainable and data-driven

All elements are made the same size to avoid layout-related boundary
event issues.

Fixes: #56614
Bug: 404479707"
```

**Commit message guidelines:**
- First line: Short summary (50 chars or less)
- Blank line
- Detailed explanation (what, why, how)
- Reference issues: `Fixes #XXXX`, `Related to #XXXX`
- Reference bugs: `Bug: XXXXX`

### Step 6: Push to Your Fork

```bash
# Push your branch
git push origin fix/pointer-events-slot-removal
```

### Step 7: Create the Pull Request

**On GitHub:**

1. Visit your fork: `https://github.com/YOUR_USERNAME/wpt`
2. Click "Compare & pull request" (or "New pull request")
3. Ensure:
   - Base: `web-platform-tests/wpt` → `main`
   - Compare: `YOUR_USERNAME/wpt` → `fix/pointer-events-slot-removal`

**Fill in the PR template:**

```markdown
# Description

Fix expectations in pointerevent_after_target_removed_from_slot.html to match
spec-compliant behavior and browser implementations.

## Issue
Closes #56614

## Changes
- Migrate HTML structure to use declarative shadow root instead of custom element
- Add three test scenarios: remove-slot, remove-filler, change-slotname
- Update expected events to include proper boundary events (pointerout, pointerleave)
- Refactor test code for maintainability

## Testing
- [x] Tested in Chrome
- [x] Tested in Safari
- [ ] Tested in Firefox (known issues)
- [x] Test passes locally
- [x] Linting passes

## Related
- Related to Chromium Bug 404479707
- Implements W3C Pointer Events spec requirements for event retargeting and boundary events

## Manual Testing
Created manual test case: https://codepen.io/username/full/XXXXX
```

### Step 8: Respond to Reviews

**Types of feedback:**

1. **Requested Changes**: Must be addressed before merge
   ```bash
   # Make the requested changes
   git add .
   git commit --amend  # Or new commit
   git push --force-with-lease origin fix/pointer-events-slot-removal
   ```

2. **Comments**: Address or explain
   - Reply in GitHub to each comment
   - Update code if needed

3. **Approvals**: Good to merge!

---

## Example PR Checklist

Before submitting, verify:

- [ ] Code changes follow WPT style guide
- [ ] Test passes locally in Chrome
- [ ] Test passes locally in Firefox (if applicable)
- [ ] Test passes locally in Safari (if applicable)
- [ ] No console errors or warnings
- [ ] Linting passes (`./wpt lint`)
- [ ] Commit message is descriptive
- [ ] Issue number is referenced
- [ ] No merge conflicts
- [ ] PR description explains changes clearly

---

## Common PR Issues and Solutions

### Issue: "The build is failing"

**Solution:**
1. Check the CI logs for specific errors
2. Most likely: linting issues
3. Fix with: `./wpt lint --fix filename`
4. Commit and push again

### Issue: "Tests don't pass in Firefox"

**Solution:**
1. Check if Firefox has known bugs filed
2. Document Firefox-specific behavior in comments
3. Consider browser-specific test variants

### Issue: "Merge conflicts"

**Solution:**
```bash
# Fetch latest upstream
git fetch upstream

# Rebase on upstream/main
git rebase upstream/main

# Resolve conflicts in your editor
# Then:
git add .
git rebase --continue
git push --force-with-lease origin your-branch
```

### Issue: "Need to update based on feedback"

**Solution:**
```bash
# Make changes
git add .

# Either squash into previous commit (preferred for small fixes)
git commit --amend --no-edit
git push --force-with-lease origin your-branch

# Or create new commit (preferred for significant changes)
git commit -m "Address review feedback"
git push origin your-branch
```

---

## Detailed Commit Message Template

```
Concise title describing the change (50 chars max)

Longer explanation of what the change is, why it's needed, and how it
addresses the issue. Include relevant technical details.

Changes:
- Specific change 1
- Specific change 2
- Specific change 3

Any additional context or references.

Fixes: #56614
Bug: 404479707
Reviewed-on: https://link-to-chromium-review (if applicable)
Related to: https://w3c.github.io/pointerevents/
```

---

## WPT-Specific Guidelines

### File Naming
- Descriptive names: `pointerevent_after_target_removed_from_slot.html`
- Include variant: `?mouse`, `?touch`, `?pen`
- Manual tests: suffix with `-manual`

### Test Structure
```javascript
// 1. Setup
setup_function();

// 2. Individual tests
promise_test(async test => {
  // Test code
}, "Test name");

// Or use test() for synchronous tests
test(function() {
  // Test code
}, "Test name");
```

### Header Requirements
```html
<!DOCTYPE HTML>
<link rel="help" href="https://w3c.github.io/pointerevents/#section">
<title>Descriptive test title</title>
<meta name="variant" content="?mouse">
<meta name="variant" content="?touch">
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
```

### Recommended Includes
```javascript
<script src="/resources/testdriver.js"></script>
<script src="/resources/testdriver-actions.js"></script>
<script src="/resources/testdriver-vendor.js"></script>
<script src="pointerevent_support.js"></script>
```

---

## After Merge

Once your PR is merged:

1. **GitHub will close the PR** automatically
2. **Your branch can be deleted** (GitHub offers this)
3. **Update your local repo:**
   ```bash
   git fetch upstream
   git checkout upstream/main
   git branch -d fix/pointer-events-slot-removal
   ```

4. **Your contribution is now part of WPT!** 🎉
   - Used by browsers for testing
   - Referenced by developers
   - Part of the web standard compliance suite

---

## Resources

### WPT Documentation
- CONTRIBUTING.md in WPT repo
- Writing tests: https://web-platform-tests.org/writing-tests/index.html
- Meta tags: https://web-platform-tests.org/writing-tests/metadata.html

### W3C Specifications
- Pointer Events: https://w3c.github.io/pointerevents/
- DOM Events: https://dom.spec.whatwg.org/
- HTML: https://html.spec.whatwg.org/

### Git/GitHub Help
- Git docs: https://git-scm.com/doc
- GitHub help: https://docs.github.com/
- Resolving merge conflicts: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts

---

## Example Commands (Quick Reference)

```bash
# Setup
git clone https://github.com/YOUR_USERNAME/wpt.git
cd wpt
git remote add upstream https://github.com/web-platform-tests/wpt.git

# Create branch
git fetch upstream
git checkout -b fix/issue-56614 upstream/main

# Make changes
nano pointerevents/pointerevent_after_target_removed_from_slot.html

# Test locally
./wpt serve  # In another terminal
# Open browser to http://localhost:8000/pointerevents/...

# Commit
git add pointerevents/pointerevent_after_target_removed_from_slot.html
git commit -m "Fix pointerevent_after_target_removed_from_slot.html assertions

[Detailed message]"

# Lint
./wpt lint --fix pointerevents/pointerevent_after_target_removed_from_slot.html

# Push
git push origin fix/issue-56614

# Create PR on GitHub (online)
```

---

## Final Checklist

- [ ] Forked WPT repo
- [ ] Cloned to local machine
- [ ] Added upstream remote
- [ ] Created feature branch
- [ ] Made test changes
- [ ] Tested locally in multiple browsers
- [ ] Ran WPT linter
- [ ] Committed with descriptive message
- [ ] Pushed to your fork
- [ ] Created pull request on GitHub
- [ ] Waited for CI checks to pass
- [ ] Responded to reviewer feedback
- [ ] PR was merged to main
- [ ] Cleaned up local branch

Congratulations on contributing to the Web Platform Tests! 🚀
