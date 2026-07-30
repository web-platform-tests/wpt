// META: title=Event constructors

// There is another version of this test with window-only events, in
// Event-subclasses-constructors-dom-events.window.js.

function assert_props(iface, event, defaults) {
  assert_true(event instanceof self[iface]);
  expected[iface].properties.forEach(function(p) {
    var property = p[0], value = p[defaults ? 1 : 2];
    assert_true(property in event,
                "Event " + format_value(event) + " should have a " +
                property + " property");
    assert_equals(event[property], value,
                  "The value of the " + property + " property should be " +
                  format_value(value));
  });
  if ("parent" in expected[iface]) {
    assert_props(expected[iface].parent, event, defaults);
  }
}

// Class declarations don't go on the global by default, so put it there ourselves:

self.SubclassedEvent = class SubclassedEvent extends Event {
  constructor(name, props) {
    super(name, props);
    if (props && typeof(props) == "object" && "customProp" in props) {
      this.customProp = props.customProp;
    } else {
      this.customProp = 5;
    }
  }

  get fixedProp() {
    return 17;
  }
}

var expected = {
  "Event": {
    "properties": [
      ["bubbles", false, true],
      ["cancelable", false, true],
      ["isTrusted", false, false],
    ],
  },

  "SubclassedEvent": {
    "parent": "Event",
    "properties": [
      ["customProp", 5, 8],
      ["fixedProp", 17, 17],
    ],
  },
};

Object.keys(expected).forEach(function(iface) {
  test(function() {
    var event = new self[iface]("type");
    assert_props(iface, event, true);
  }, iface + " constructor (no argument)");

  test(function() {
    var event = new self[iface]("type", undefined);
    assert_props(iface, event, true);
  }, iface + " constructor (undefined argument)");

  test(function() {
    var event = new self[iface]("type", null);
    assert_props(iface, event, true);
  }, iface + " constructor (null argument)");

  test(function() {
    var event = new self[iface]("type", {});
    assert_props(iface, event, true);
  }, iface + " constructor (empty argument)");

  test(function() {
    var dictionary = {};
    expected[iface].properties.forEach(function(p) {
      var property = p[0], value = p[1];
      dictionary[property] = value;
    });
    var event = new self[iface]("type", dictionary);
    assert_props(iface, event, true);
  }, iface + " constructor (argument with default values)");

  test(function() {
    function fill_in(iface, dictionary) {
      if ("parent" in expected[iface]) {
        fill_in(expected[iface].parent, dictionary)
      }
      expected[iface].properties.forEach(function(p) {
        var property = p[0], value = p[2];
        dictionary[property] = value;
      });
    }

    var dictionary = {};
    fill_in(iface, dictionary);

    var event = new self[iface]("type", dictionary);
    assert_props(iface, event, false);
  }, iface + " constructor (argument with non-default values)");
});
