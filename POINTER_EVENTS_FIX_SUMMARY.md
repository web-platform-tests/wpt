# Pointer Events After Slot Removal - Issue Resolution

## Overview
This document explains the resolution to the issue with `pointerevent_after_target_removed_from_slot.html` test that was failing across all browsers.

**GitHub Issue:** [#56614 - Expectations in pointerevent_after_target_removed_from_slot.html](https://github.com/web-platform-tests/wpt/issues/56614)

**Fixed by Commit:** [a9f4351e61506bfec0a0c111f22d164cf213aa1c](https://github.com/web-platform-tests/wpt/commit/a9f4351e61506bfec0a0c111f22d164cf213aa1c)

---

## Problem Statement

The test was failing in all browsers because the test assertions were not aligned with the actual event dispatch behavior in Shadow DOM when elements are removed from slots.

### Key Issues:
1. **Firefox behavior difference**: Firefox was not dispatching `pointerout` and `pointerleave` events to `#filler` when the slot was removed, while Chrome and Safari did.

2. **Event retargeting differences**: Chrome and Safari were re-targeting `pointerover` events from `#parent` to `#host`, while Firefox was not.

3. **Related target leaking**: The original test and implementation had concerns about `.relatedTarget` leaking shadow DOM elements to light DOM, which is a privacy/security concern.

---

## Solution

The fix involved three main changes:

### 1. **HTML Structure Refactoring**
Changed from a custom element with dynamic shadow root creation to declarative shadow root:

**Before:**
```html
<template id="template">
  <style>
    div { width: 100px; height: 100px; }
  </style>
  <div id="parent">
    <slot id="slot">slot</slot>
  </div>
</template>

<my-elem id="host">
  <div id="child">child</div>
</my-elem>
```

**After:**
```html
<div id="host">
  <template id="template" shadowrootmode="open">
    <style>
      div { width: 100px; height: 100px; }
    </style>
    <div id="parent">
      <slot id="slot">
        <div></div>
      </slot>
    </div>
  </template>
  <div id="filler"></div>
</div>
```

### 2. **Multiple Test Scenarios**
Added three different removal methods to test different scenarios:
- **remove-slot**: Tests removing the `<slot>` element from the shadow tree
- **remove-filler**: Tests removing the light DOM element placed in the slot
- **change-slotname**: Tests changing the slot attribute to unslot the element

### 3. **Updated Event Expectations**
The key fix was clarifying the expected pointer events based on actual browser behavior:

#### For "remove-slot at pointerdown":
```javascript
[
  "pointerover@filler",
  "pointerenter@host", "pointerenter@parent", "pointerenter@slot", "pointerenter@filler",
  "pointerdown@filler", "(removed)",
  "pointerout@filler", "pointerleave@filler",           // ← These were missing before
  "pointerover@parent", "pointerover@host", 
  "pointerup@parent", "pointerup@host",
  "pointerdown@parent", "pointerdown@host", 
  "pointerup@parent", "pointerup@host",
  "pointerout@parent", "pointerout@host",
  "pointerleave@parent", "pointerleave@host"
]
```

#### For "remove-filler at pointerdown":
```javascript
[
  "pointerover@filler",
  "pointerenter@host", "pointerenter@parent", "pointerenter@slot", "pointerenter@filler",
  "pointerdown@filler", "(removed)",
  "pointerover@slot",                                    // ← Element now reveals slot
  "pointerup@slot",
  "pointerdown@slot", "pointerup@slot",
  "pointerout@slot",
  "pointerleave@slot", "pointerleave@parent", "pointerleave@host"
]
```

---

## Key Insights

### Shadow DOM Event Dispatch Behavior:

1. **Removing a slot element**: When `#slot` is removed from the shadow tree while `#filler` is still hovering:
   - `#filler` becomes hidden but remains in the light DOM
   - Proper boundary events (`pointerout` and `pointerleave`) are dispatched to `#filler`
   - Events for `#parent` (now under the pointer) are dispatched

2. **Removing slotted element**: When `#filler` is removed while slotted:
   - The slot's fallback content is revealed (the empty `<div>`)
   - Events shift to the newly revealed element

3. **Event retargeting**: Pointer events follow the standard DOM event retargeting rules for shadow DOM:
   - Events dispatched from shadow tree elements are retargeted when bubbling out
   - The `relatedTarget` must not expose shadow DOM internals

### Spec Compliance:

The fix aligns with the W3C Pointer Events specification:
- Events are correctly dispatched based on hit-testing
- Event retargeting follows DOM specification rules
- Boundary events (enter/leave) are properly fired when pointer moves between elements

---

## Testing

The fixed test now:
1. Properly tests all three removal methods
2. Has clear, documented expectations
3. Validates event ordering and targets
4. Ensures boundary events are correctly dispatched
5. Prevents shadow DOM leakage via `relatedTarget`

### Manual Testing Reference:
The developer created a CodePen for manual testing: https://codepen.io/mustaqahmed/full/LEGgpMQ

---

## Technical Details

### Element Sizing
All elements are made the same size (100px × 100px) to avoid layout-related boundary event issues:
```css
div {
  width: 100px;
  height: 100px;
}
```

### Event Logging
The test logs events that reach the AT_TARGET phase:
```javascript
function logEvent(e) {
  if (e.eventPhase == e.AT_TARGET) {
    event_log.push(e.type + "@" + e.target.id);
  }
}
```

### Event Assertion
Events are compared before and after the removal marker:
```javascript
let removal_in_event_log = event_log.indexOf("(removed)");
assert_equals(event_log.slice(0, removal_in_event_log).toString(),
    expected_events.slice(0, removal_in_expected_list).toString(),
    "events received before removal");
```

---

## Browser Compliance

After this fix, browsers should align on:
1. ✅ Dispatching boundary events when visibility changes due to DOM modification
2. ✅ Proper event retargeting across shadow boundaries
3. ✅ Not leaking shadow DOM elements via `relatedTarget`

---

## References

- **W3C Pointer Events Spec**: https://w3c.github.io/pointerevents/
- **DOM Event Retargeting**: https://dom.spec.whatwg.org/#retarget
- **Chromium Bug**: 404479707
- **Chromium Code Review**: https://chromium-review.googlesource.com/c/chromium/src/+/7107458
