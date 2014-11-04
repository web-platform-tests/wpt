/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
 */

"use strict";

// Creates and returns new HTML document
function newHTMLDocument() {
    return document.implementation.createHTMLDocument('Test Document');
}

// Returns true if timed item is in current as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-current
function isCurrent(timedItem) {
    return isInBeforePhase(timedItem) || isInPlay(timedItem)
        || (timedItem.parent !== null && isCurrent(timedItem.parent));
}

// Returns true if timed item is in before phase as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-before-phase
function isInBeforePhase(timedItem) {
    return timedItem.localTime !== null
            && timedItem.startTime < timedItem.timing.delay;
}

// Returns true if timed item is in play as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-in-play
function isInPlay(timedItem) {
    var condition1 = isInActivePhase(timedItem);
    var condition2 = false;
    if (timedItem.parent !== null && isInPlay(timedItem.parent)) {
        condition2 = true;
    } else if (timedItem.player !== null && !isLimited(timedItem.player)) {
        condition2 = true;
    }
    return  condition1 && condition2;
}

// Returns true if timed item is in active phase as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-active-phase
function isInActivePhase(timedItem) {
    return timedItem.localTime !== null
            && timedItem.startTime >= timedItem.timing.delay
            && timedItem.startTime <= timedItem.timing.delay
                    + timedItem.activeDuration;
}

// Returns true if player is limited as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-limited
function isLimited(player) {
    return (player.playbackRate > 0 && player.currentTime >= getPlayerSourceContentEnd(player))
        || (player.playbackRate < 0 && player.currentTime <= 0);
}

// Returns player source content end as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-source-content-end
function getPlayerSourceContentEnd(player) {
    if (player.source === null) {
        return 0;
    }
    return getEndTime(player.source);
}

// Returns end time of a timed item as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-end-time
function getEndTime(timedItem) {
    return timedItem.startTime + timedItem.timing.delay + timedItem.activeDuration + timedItem.timing.endDelay;
}
