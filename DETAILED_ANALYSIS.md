# Detailed Analysis: Pointer Events with Shadow DOM Slot Removal

## Executive Summary

The WPT test `pointerevent_after_target_removed_from_slot.html` had incorrect assertions about pointer event behavior when DOM elements are removed from shadow DOM slots. This analysis explains:

1. What the issue was
2. Why it occurred
3. How it was fixed
4. The spec-compliant behavior expected

---

## The Core Issue

### Question 1: Should `pointerout`/`pointerleave` be sent to removed elements?

**Issue Description:**
When a slot element is removed from the shadow tree while a light DOM element (`#filler`) is still hovering over it:
- The light DOM element (`#filler`) becomes hidden
- Chrome and Safari dispatched `pointerout` and `pointerleave` to `#filler`
- Firefox did NOT dispatch these events
- The test had wrong expectations

**Why This Matters:**
From a developer perspective, boundary events should come in pairs:
- `pointerenter` → `pointerleave`
- `pointerover` → `pointerout`

If only one half of the pair is sent, it can lead to developer bugs where hover states aren't properly cleaned up.

**The Fix:**
The test was updated to expect `pointerout` and `pointerleave` to be sent:
```javascript
"pointerout@filler", "pointerleave@filler",
```

This is the correct behavior because the pointer is no longer over `#filler` (it's now over the newly-revealed `#parent`).

---

### Question 2: Should `pointerover` be retargeted across shadow boundaries?

**Issue Description:**
When the pointer is over `#parent` in the shadow DOM:
- All browsers send a `pointerover` event to `#parent`
- Chrome and Safari ALSO send a retargeted `pointerover` to `#host` (the shadow root)
- Firefox does NOT retarget the event to `#host`

**Why This Matters:**
Event retargeting is a fundamental part of the Shadow DOM spec:
- Events that originate in shadow DOM should be retargeted when they bubble
- This prevents light DOM code from seeing internal shadow DOM details
- However, the event SHOULD reach the shadow host with the proper target

**The Fix:**
The test was updated to expect the retargeted events:
```javascript
"pointerover@parent", "pointerover@host",
```

This follows the standard Shadow DOM event retargeting pattern.

---

## Technical Deep Dive

### Event Retargeting Rules (from DOM Spec)

When an event bubbles out of a shadow root:

1. The event's `target` is adjusted to be the shadow host
2. The event's `relatedTarget` (if any) is adjusted
3. Event listeners on the shadow host see the retargeted event

**Critically**: The `relatedTarget` must NOT expose shadow DOM internals to light DOM code.

---

### The Scenario: Step-by-Step

#### Initial State
```
Light DOM:                Shadow DOM:
<host>                    #parent
  <filler>    ─────→        <slot>
                              (filler is placed here)
```

Pointer is over `#filler`. Events dispatched:
```
pointerenter@host
pointerenter@parent  (in shadow DOM, so retargeted to host)
pointerenter@slot
pointerenter@filler
```

#### Slot Removal (on pointerdown event)
```
Light DOM:                Shadow DOM:
<host>                    #parent
  <filler>    ───X→        <slot>  ← REMOVED
  (hidden)
```

What happens:
1. `#filler` becomes hidden (no longer in a slot, so not rendered)
2. Pointer is now over `#parent`
3. Browser fires boundary events for the change

Expected event sequence:
```javascript
"pointerdown@filler",        // The event that triggered removal
"(removed)",                 // Marker indicating slot was removed

// Now handle the pointer position change
"pointerout@filler",         // Pointer left filler
"pointerleave@filler",       // And left filler's ancestry
"pointerover@parent",        // Pointer now over parent
"pointerover@host",          // (retargeted from parent)
"pointerup@parent",          // Subsequent pointer events
"pointerup@host"
```

---

## The Three Test Cases

The fixed test covers three different removal scenarios:

### Test 1: `remove-slot`
Removes the `<slot>` element from shadow DOM

**Before removal:**
- `#filler` is slotted in `#slot`
- Pointer over `#filler`

**After removal:**
- `#filler` is hidden (not in document flow)
- Pointer over `#parent` (where `#filler` was rendered)

**Expected events after removal:**
```javascript
"pointerout@filler",
"pointerleave@filler",
"pointerover@parent",
"pointerover@host",  // retargeted
"pointerup@parent",
"pointerup@host"
```

---

### Test 2: `remove-filler`
Removes the `#filler` element from light DOM

**Before removal:**
- `#filler` is slotted in `#slot`
- Pointer over `#filler`

**After removal:**
- The slot's fallback content is revealed (empty `<div>`)
- Pointer over that fallback div

**Expected events after removal:**
```javascript
"pointerover@slot",          // Fallback content now revealed
"pointerup@slot",            // Subsequent events go to fallback
"pointerdown@slot",
"pointerup@slot",
"pointerout@slot",
"pointerleave@slot",
"pointerleave@parent",       // Leaving parent
"pointerleave@host"          // Leaving host
```

Note: No `pointerout@filler` because `#filler` was removed entirely.

---

### Test 3: `change-slotname`
Changes the `slot` attribute of `#filler`, unslotting it

**Before removal:**
- `#filler` has no slot attribute (or slot="")
- `#filler` is in default slot
- Pointer over `#filler`

**After removal:**
- `#filler` has slot="xyz" (non-existent slot)
- `#filler` is hidden (not slotted)
- Pointer over `#parent`

**Expected events after removal:**
```javascript
"pointerout@filler",         // Similar to remove-slot
"pointerleave@filler",
"pointerover@parent",
"pointerover@host",
"pointerup@parent",
"pointerup@host",
"pointerdown@parent",
"pointerdown@host",
"pointerup@parent",
"pointerup@host",
"pointerout@parent",
"pointerout@host",
"pointerleave@parent",
"pointerleave@host"
```

---

## Why Firefox's Behavior Was Different

Firefox's implementation didn't properly handle:

1. **Boundary events during dynamic shadow DOM changes**: When the DOM is modified during pointer operations, Firefox didn't always fire the expected `pointerout`/`pointerleave` events.

2. **Event retargeting**: Firefox may have been skipping retargeting when the original target was no longer in the tree.

The fix in the test expectations validates the correct behavior that Chrome and Safari were already doing.

---

## Implementation Insights

### Key Code Changes

**Original test structure:**
```javascript
customElements.define("my-elem", class extends HTMLElement {
  constructor() {
    super();
    let content = document.getElementById("template").content;
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(content.cloneNode(true));
  }
});
```

**Fixed test structure:**
```html
<div id="host">
  <template id="template" shadowrootmode="open">
    <!-- Shadow DOM content -->
  </template>
  <div id="filler"></div>
</div>
```

**Why this change matters:**
1. Declarative shadow roots are more standard and predictable
2. Eliminates custom element constructor timing issues
3. Makes test expectations clearer

---

### Event Listener Setup

The test listens for all pointer events at AT_TARGET phase:

```javascript
const events = [
  "pointerover", "pointerout",
  "pointerenter", "pointerleave", 
  "pointerdown", "pointerup"
];
let targets = [host, parent, slot, filler];

for (let i = 0; i < targets.length; i++) {
  events.forEach(event => targets[i].addEventListener(event, logEvent));
}
```

The `logEvent` function only logs AT_TARGET phase events:
```javascript
function logEvent(e) {
  if (e.eventPhase == e.AT_TARGET) {
    event_log.push(e.type + "@" + e.target.id);
  }
}
```

This ensures we're testing what each element actually receives, not bubble/capture phase artifacts.

---

## Browser Behavioral Patterns

### Chrome/Safari (Correct Behavior)
✅ Fires boundary events when pointer's position relative to elements changes
✅ Properly retargets shadow DOM events
✅ Maintains correct relatedTarget values

### Firefox (Before Fix)
❌ Doesn't fire boundary events for hidden elements
❌ Doesn't properly retarget shadow DOM events
(These are implementation bugs that Firefox would need to fix)

---

## Spec References

### 1. W3C Pointer Events Specification
- https://w3c.github.io/pointerevents/#firing-events-using-the-pointerevent-interface
- Defines how pointer events should be fired
- References DOM event dispatch algorithm

### 2. WHATWG DOM Specification
- https://dom.spec.whatwg.org/#retarget
- Defines event retargeting rules for shadow DOM
- Critical for understanding cross-boundary event behavior

### 3. HTML Living Standard
- Shadow roots and slots behavior
- Hit-testing and pointer positioning

---

## Summary of Spec-Compliant Behavior

### Pointer Events in Shadow DOM:
1. ✅ Events originating in shadow DOM are retargeted when bubbling
2. ✅ `target` reflects the retargeted element (shadow host when bubbling out)
3. ✅ Boundary events fire when pointer moves between elements
4. ✅ `relatedTarget` is adjusted to avoid exposing shadow internals
5. ✅ Hit-testing respects the flattened DOM tree

### The Fix Validates:
- Correct event firing order
- Proper retargeting across shadow boundaries  
- Boundary event completeness (enter/leave pairs)
- Privacy (no shadow DOM leakage via relatedTarget)

---

## Chromium Implementation Details

The fix was implemented in Chromium as part of:
- **Bug**: 404479707
- **CL**: https://chromium-review.googlesource.com/c/chromium/src/+/7107458
- **Reviewed by**: Robert Flack
- **Date**: November 6, 2025

This Chromium fix likely involved:
1. Proper hit-testing when DOM elements are hidden
2. Correct event retargeting implementation
3. Ensuring boundary events are fired for hidden elements

---

## Conclusion

The fix to `pointerevent_after_target_removed_from_slot.html` ensures that:

1. **Test assertions are spec-compliant**: The expected events match the W3C specifications
2. **All browsers align**: The test validates the correct behavior that Chrome/Safari were already doing
3. **Boundary events are complete**: Pairing of enter/leave and over/out is maintained
4. **Shadow DOM privacy is protected**: relatedTarget doesn't leak shadow elements

This is a critical test for ensuring consistent pointer event handling across browsers when working with Shadow DOM slots.
