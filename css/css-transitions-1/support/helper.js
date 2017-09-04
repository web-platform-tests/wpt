//
// Simple Helper Functions For Testing CSS
//

(function(root) {
'use strict';

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

/*
 * The recommended minimum precision to use for time values.
 *
 * Based on Web Animations:
 * https://w3c.github.io/web-animations/#precision-of-time-values
 */
const TIME_PRECISION = 0.0005; // ms

/*
 * Allow implementations to substitute an alternative method for comparing
 * times based on their precision requirements.
 */
root.assert_times_equal = function(actual, expected, description) {
  assert_approx_equals(actual, expected, TIME_PRECISION, description);
}

/**
 * Appends a div to the document body.
 *
 * @param t  The testharness.js Test object. If provided, this will be used
 *           to register a cleanup callback to remove the div when the test
 *           finishes.
 *
 * @param attrs  A dictionary object with attribute names and values to set on
 *               the div.
 */
root.addDiv = function(t, attrs) {
  var div = document.createElement('div');
  if (attrs) {
    for (var attrName in attrs) {
      div.setAttribute(attrName, attrs[attrName]);
    }
  }
  document.body.appendChild(div);
  if (t && typeof t.add_cleanup === 'function') {
    t.add_cleanup(function() {
      if (div.parentNode) {
        div.remove();
      }
    });
  }
  return div;
}

})(window);
