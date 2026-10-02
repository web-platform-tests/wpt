# Pull Request Guide: Pointer Events After Slot Removal Fix

## Overview
This guide explains the already-merged fix to `pointerevent_after_target_removed_from_slot.html` and how to understand/reproduce/contribute to similar fixes.

---

## The Merged Fix

**Commit Hash:** `a9f4351e61506bfec0a0c111f22d164cf213aa1c`
**Tag:** `merge_pr_55894`
**Merged:** November 6, 2025
**Author:** Mustaq Ahmed (mustaq@google.com)

### Files Modified:
- `pointerevents/pointerevent_after_target_removed_from_slot.html` (184 insertions, 81 deletions)

---

## What Was Changed

### 1. HTML Structure Migration

#### Before (Custom Element Approach):
```html
<template id="template">
  <div id="parent">
    <slot id="slot">slot</slot>
  </div>
</template>

<my-elem id="host">
  <div id="child">child</div>
</my-elem>
```

#### After (Declarative Shadow Root):
```html
<div id="host">
  <template id="template" shadowrootmode="open">
    <div id="parent">
      <slot id="slot">
        <div></div>
      </slot>
    </div>
  </template>
  <div id="filler"></div>
</div>
```

**Why this change:**
- ✅ Declarative shadow roots are simpler and more standard
- ✅ Avoids custom element timing issues
- ✅ More predictable element initialization order
- ✅ Better represents real-world use cases

---

### 2. Test Scenarios Expansion

#### Before:
- Only 2 removal test cases:
  - Removing the slot
  - Removing the slotted child

#### After:
- 3 removal test cases:
  - **remove-slot**: Tests removing `<slot>` from shadow tree
  - **remove-filler**: Tests removing light DOM element from slot
  - **change-slotname**: Tests unslotting by changing slot attribute

**Why this change:**
- ✅ More comprehensive coverage
- ✅ Tests different DOM modification scenarios
- ✅ Each case has different expected behavior
- ✅ Better documents expected behavior

---

### 3. Event Expectations Update

#### Key Insight: Boundary Events Must Be Complete

**Before (Incorrect):**
When `#slot` is removed, no `pointerout`/`pointerleave` were expected for `#filler`
```javascript
[
  "pointerover@child",
  "pointerenter@...", "pointerenter@...", "pointerenter@...", "pointerenter@child",
  "pointerdown@child", "(child-removed)",
  // Missing: pointerout@child, pointerleave@child
  "pointerover@parent", "pointerover@host",
  ...
]
```

**After (Correct):**
Proper boundary events are expected:
```javascript
[
  "pointerover@filler",
  "pointerenter@host", "pointerenter@parent", "pointerenter@slot", "pointerenter@filler",
  "pointerdown@filler", "(removed)",
  "pointerout@filler", "pointerleave@filler",         // ← NOW EXPECTED
  "pointerover@parent", "pointerover@host",
  "pointerup@parent", "pointerup@host",
  "pointerdown@parent", "pointerdown@host",
  "pointerup@parent", "pointerup@host",
  "pointerout@parent", "pointerout@host",
  "pointerleave@parent", "pointerleave@host"
]
```

---

### 4. Code Cleanup and Refactoring

#### Variable Naming:
- `shadow_host` → `host`
- `slotted_child` → `filler`
- `elem_to_remove` → removed
- `(child-removed)` → `(removed)`

**Why:** Better reflects the semantic meaning

#### Test Parameterization:
```javascript
// Before: Hard to extend
addPromiseTest(remover_event, tested_elem_to_remove, expected_events)

// After: Cleaner, data-driven
const modifier_methods = {
  "remove-slot": { "remover": () => {...}, "restorer": () => {...} },
  "remove-filler": { "remover": () => {...}, "restorer": () => {...} },
  "change-slotname": { "remover": () => {...}, "restorer": () => {...} }
}

addPromiseTest(remover_event, removal_type, expected_events)
```

**Why:** Easier to add new test cases, DRY principle

---

## Event Behavior Insights

### Principle 1: Boundary Events Come in Pairs
- If `pointerenter` fires, expect `pointerleave`
- If `pointerover` fires, expect `pointerout`
- Even when DOM changes dynamically

### Principle 2: Event Retargeting
- Events from shadow DOM bubble up with `target` adjusted
- `pointerover@parent` becomes `pointerover@host` when bubbling out
- Both events are dispatched (not one replacing the other)

### Principle 3: Hit Testing Updates
- When DOM changes, hit testing is recalculated
- New hit test target gets proper events
- Old hit test target gets boundary events

---

## Testing the Fix

### Running the Test Locally:

```bash
# Navigate to WPT repository
cd /path/to/wpt

# Start the test server
./wpt serve

# Open in browser
# http://localhost:8000/pointerevents/pointerevent_after_target_removed_from_slot.html?mouse
```

### Test Variants:
- `?mouse` - Test with mouse events
- `?touch` - Test with touch events (if implementation supports)
- `?pen` - Test with pen events (if implementation supports)

### Expected Results (after fix):
✅ All 6 sub-tests should pass
- pointerdown + remove-slot
- pointerdown + remove-filler  
- pointerdown + change-slotname
- pointerup + remove-slot
- pointerup + remove-filler
- pointerup + change-slotname

---

## Browser Compatibility Notes

### Chrome/Chromium
✅ **Passes all tests**
- Correctly fires boundary events
- Properly retargets shadow DOM events

### Safari
✅ **Passes all tests**
- Correctly fires boundary events
- Properly retargets shadow DOM events

### Firefox
❌ **May fail some tests**
- Known issue with boundary events on hidden elements
- Related to hit-testing during DOM changes
- Bug filed in Firefox tracker

---

## Key Code Patterns to Learn

### 1. Event Logging with Phase Filtering
```javascript
function logEvent(e) {
  if (e.eventPhase == e.AT_TARGET) {
    event_log.push(e.type + "@" + e.target.id);
  }
}
```
**Lesson**: Only log AT_TARGET phase to see what each element actually receives

### 2. Event Listener Setup on Multiple Targets
```javascript
const events = ["pointerover", "pointerout", "pointerenter", 
                "pointerleave", "pointerdown", "pointerup"];
const targets = [host, parent, slot, filler];

for (let target of targets) {
  for (let event of events) {
    target.addEventListener(event, logEvent);
  }
}
```
**Lesson**: Listen to all relevant events on all relevant targets

### 3. Marker-Based Event Log Assertions
```javascript
let removal_in_event_log = event_log.indexOf("(removed)");
assert_true(removal_in_event_log != -1, "(removed) in event log");

// Compare before removal
assert_equals(
  event_log.slice(0, removal_in_event_log).toString(),
  expected_events.slice(0, removal_in_expected_list).toString(),
  "events received before removal"
);

// Compare after removal
assert_equals(
  event_log.slice(removal_in_event_log+1).toString(),
  expected_events.slice(removal_in_expected_list+1).toString(),
  "events received after removal"
);
```
**Lesson**: Use markers to split test into before/after sections, compare independently

### 4. Test Driver Actions
```javascript
let actions = new test_driver.Actions()
  .addPointer("TestPointer", pointer_type)
  .pointerMove(-30, -30, {origin: host})
  .pointerDown()
  .pointerUp()
  .pointerMove(30, 30, {origin: host})
  .pointerDown()
  .pointerUp()
  .pointerMove(0, 0, {origin: done})
  .pointerDown()
  .pointerUp();

await actions.send();
```
**Lesson**: Use test_driver for reliable, repeatable pointer actions

---

## Contributing Similar Fixes

If you encounter other pointer event issues, follow this pattern:

### Step 1: Identify the Issue
- What are the expected vs. actual events?
- Is it timing-related?
- Is it shadow DOM related?

### Step 2: Create Reproducible Test
- Simplify to minimal case
- Make a manual test case (CodePen, etc.)
- Document the issue

### Step 3: Analyze Spec Compliance
- Check W3C Pointer Events spec
- Check DOM event retargeting rules
- Check browser implementation details

### Step 4: Fix Test or Browser
- If test is wrong: Update expected events
- If browser is wrong: File bug with browser vendor
- If spec is wrong: File issue with W3C

### Step 5: Document Thoroughly
- Explain why behavior changed
- Reference spec sections
- Provide manual test case

---

## Chromium Implementation Details

The parallel Chromium fix (Bug 404479707) likely involved:

1. **Hit Testing**: Ensure hit testing is correctly updated when DOM changes
2. **Event Dispatch**: Fire proper boundary events when hit test target changes
3. **Event Retargeting**: Correctly adjust event targets across shadow boundaries
4. **Related Target**: Ensure relatedTarget doesn't leak shadow DOM

### References:
- **Bug**: https://bugs.chromium.org/p/chromium/issues/detail?id=404479707
- **CL**: https://chromium-review.googlesource.com/c/chromium/src/+/7107458

---

## Related Tests and Issues

### Similar Tests in WPT:
- `pointerevent_to_slotted_target.html` - Basic slot event handling
- `pointerevent_boundary_events_attributes_during_drag.html` - Boundary events
- `pointerevent_lostpointercapture_for_disconnected_node.html` - Disconnected nodes

### Related Issues:
- [W3C Pointer Events #489](https://github.com/w3c/pointerevents/issues/489) - Event retargeting
- [WHATWG DOM #1089](https://github.com/whatwg/dom/issues/1089) - Event retargeting edge cases
- Chrome Bug 465787217 - Related target leaking in shadow DOM

---

## Debugging Tips

### If a test fails:
1. Log all events: `console.log(event_log)`
2. Compare with expected: `console.log(expected_events)`
3. Find first difference: Use array diff
4. Check browser DevTools: Inspect shadow DOM structure
5. Verify hit test: Use browser inspector to see pointer position

### Chrome DevTools:
- Enable "Show user agent shadow DOM" to see internals
- Use Elements panel to inspect shadow roots
- Use Events listener breakpoints for pointer events

### Firefox DevTools:
- Inspector shows shadow roots
- Debugger for step-through testing
- Console for logging

---

## Conclusion

This fix is a model for how to:
1. Identify spec-compliant behavior
2. Create comprehensive test cases
3. Document the expected behavior
4. Ensure browser consistency

The test now properly validates pointer event dispatch in shadow DOM scenarios, which is critical for web developers building interactive shadow DOM components.
