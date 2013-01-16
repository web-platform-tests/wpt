// 
// Simple Helper Functions For Testing CSS
// 

(function(root) {
"use strict";

// only add vendor prefixes in local development
//var addVendorPrefixes = !!location.hostname.match(/^(?:test\.dev|roodbook\.local)$/i);
var addVendorPrefixes = false;

// serialize styles object and dump to dom
// appends <style id="dynamic-style"> to <head>
// setStyle("#some-selector", {"some-style" : "value"})
// setStyle({"#some-selector": {"some-style" : "value"}})
root.setStyle = function(selector, styles) {
    var target = document.getElementById('dynamic-style');
    if (!target) {
        target = document.createElement('style');
        target.id = 'dynamic-style';
        target.type = "text/css";
        document.getElementsByTagName('head')[0].appendChild(target);
    }
    
    var data = [];
    // single selector/styles
    if (typeof selector === 'string' && styles !== undefined) {
        data = [selector, '{', serializeStyles(styles), '}'];
        target.textContent = data.join("\n");
        return;
    }
    // map of selector/styles
    for (var key in selector) {
        if (Object.prototype.hasOwnProperty.call(selector, key)) {
            var _data = [key, '{', serializeStyles(selector[key]), '}'];
            data.push(_data.join('\n'));
        }
    }

    target.textContent = data.join("\n");
};

function serializeStyles(styles) {
    var data = [];
    for (var property in styles) {
        if (Object.prototype.hasOwnProperty.call(styles, property)) {
            var prefixedProperty = addVendorPrefix(property);
            data.push(prefixedProperty + ":" + styles[property] + ";");
        }
    }
    
    return data.join('\n');
}

// convert "foo-bar" to "fooBar"
function camelCase(str) {
	return str.replace(/\-(\w)/g, function(match, letter){
		return letter.toUpperCase();
	});
}

// shorthand for computed style
root.computedStyle = function(element, property, pseudo) {
    var prefixedProperty = addVendorPrefix(property);
    return window
        .getComputedStyle(element, pseudo || null)
        .getPropertyValue(prefixedProperty);
};

// flush rendering buffer
root.reflow = function() {
    document.body.offsetWidth;
};

// vendor-prefix a css property
root.addVendorPrefix = function (name) {
    if (!addVendorPrefixes) {
        return name;
    }
    
    var prefix = getVendorPrefix(name);
    if (prefix === false) {
        // property unknown to browser
        return name;
    }
    
    return prefix + name;
};

// identify vendor-prefix for css property
var prefixCache = {};
root.getVendorPrefix = function(name) {
    if (prefixCache[name] !== undefined) {
        return prefixCache[name];
    }
    
    var elem = document.createElement("div");
    name = camelCase(name);

    if (name in elem.style) {
        return prefixCache[name] = "";
    }

    var prefixes = ["Webkit", "Moz", "O", "ms"];
    var styles = ["-webkit-", "-moz-", "-o-", "-ms-"];
    var _name = name.substring(0, 1).toUpperCase() + name.substring(1);

    for (var i = 0, length = prefixes.length; i < length; i++) {
        if (prefixes[i] + _name in elem.style) {
            return prefixCache[name] = styles[i];
        }
    }

    return prefixCache[name] = name in elem.style ? "" : false;
};

root.getValueVendorPrefix = function(property, value) {
    var elem = document.createElement("div");
    // note: webkit needs the element to be attached to the dom
    document.body.appendChild(elem);
    var styles = ["-webkit-", "-moz-", "-o-", "-ms-", ""];
    var _property = getVendorPrefix(property) + property;
    for (var i=0, length = styles.length; i < length; i++) {
        var _value = styles[i] + value;
        elem.setAttribute('style', _property + ": " + _value);
        var _computed = computedStyle(elem, _property);
        if (_computed && _computed !== 'none') {
            document.body.removeChild(elem);
            return styles[i];
        }
    }
    document.body.removeChild(elem);    
    return false;
};

// add all known TransitionEnd events to element
root.addTransitionEvent = function(element, handler) {
    return addEvent(element, 'TransitionEnd webkitTransitionEnd transitionend oTransitionEnd otransitionend MSTransitionEnd', handler);
};

// add space-separated list of events to element
root.addEvent = function(element, events, handler) {
    var _events = {};
    var tokens = events.split(" ");
    for (var i = 0, token; token = tokens[i]; i++) {
        element.addEventListener(token, handler, false);
        _events[token] = handler;
    }
    return _events;
};

// merge objects
root.extend = function(target /*, ..rest */) {
    Array.prototype.slice.call(arguments, 1).forEach(function(obj) {
        Object.keys(obj).forEach(function(key) {
            target[key] = obj[key];
        });
    });

    return target;
};

// dom fixture helper ("resetting dom test elements")
var _domFixture;
var _domFixtureSelector;
root.domFixture = function(selector) {
    var fixture = document.querySelector(selector || _domFixtureSelector);
    if (!fixture) {
        throw new Error('fixture ' + (selector || _domFixtureSelector) + ' not found!');
    }
    if (!_domFixture && selector) {
        // save a copy
        _domFixture = fixture.cloneNode(true);
        _domFixtureSelector = selector;
    } else if (_domFixture) {
        // restore the copy
        var tmp = _domFixture.cloneNode(true);
        fixture.parentNode.replaceChild(tmp, fixture);
    } else {
        throw new Error('domFixture must be initialized first!');
    }
};

// return requestAnimationFrame handler, if available
root.getRequestAnimationFrame = function() {
    return window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame
        || window.oRequestAnimationFrame;
};

})(window);