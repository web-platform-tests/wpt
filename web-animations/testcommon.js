/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
 */

"use strict";

// Epsilon value for assert_approx_equals()
var EPSILON = 20;
var ANIMATION_END_TIME = 1000;

// Creates and returns new HTML document
function newHTMLDocument() {
    return document.implementation.createHTMLDocument('Test Document');
}

function newAnimation(animationTarget) {
    animationTarget.style.width = '300px';
    return new Animation(animationTarget, [
        {width: '10px', offset: 0},
        {width: '100px', offset: 1/2},
        {width: '200px', offset: 1}], ANIMATION_END_TIME);
}

function newAnimationPlayer(animationTarget) {
    var animation = newAnimation(animationTarget);
    return document.timeline.play(animation);
}

// creates div element, appends it to the document body and
// add removing of the created element to test cleanup
function createDiv(test, doc) {
    if (!doc) {
        doc = document;
    }
    var div = doc.createElement('div');
    doc.body.appendChild(div);
    test.add_cleanup(function() {
        removeElement(div);
    });
    return div;
}

// Removes element
function removeElement(element) {
    element.parentNode.removeChild(element);
}

// Returns true if there is className in object prototype chain
function hasAncestorClassString(object, classString) {
    var proto = Object.getPrototypeOf(object);
    if (proto === null) {
        return false;
    }
    if (proto.constructor.name === classString) {
        return true;
    }
    return hasAncestorClassString(proto, classString);
}

// Returns true if timed item is current as defined at
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
    if (!isInActivePhase(timedItem)) {
        return false;
    }
    return (timed.parent !== null && isInPlay(timedItem.parent)) ||
        (timedItem.player !== null && !isLimited(timedItem.parent));
}

// Returns true if timed item is in active phase as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-active-phase
function isInActivePhase(timedItem) {
    return timedItem.localTime !== null
        && timedItem.startTime >= timedItem.timing.delay
        && timedItem.startTime <=
            timedItem.timing.delay + timedItem.activeDuration;
}

// Returns true if player is limited as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-limited
function isLimited(player) {
    return (player.playbackRate > 0 && player.currentTime >= calcPlayerSourceContentEnd(player))
        || (player.playbackRate < 0 && player.currentTime <= 0);
}

// Returns player source content end as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-source-content-end
function calcPlayerSourceContentEnd(player) {
    if (player.source === null) {
        return 0;
    }
    return calcEndTime(player.source);
}

// Returns end time of a timed item as defined at
// http://dev.w3.org/fxtf/web-animations/#dfn-end-time
function calcEndTime(timedItem) {
    return timedItem.startTime + timedItem.timing.delay + timedItem.activeDuration
        + timedItem.timing.endDelay;
}
