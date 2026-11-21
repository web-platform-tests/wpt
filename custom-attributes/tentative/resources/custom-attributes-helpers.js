// Helpers for the Custom Attributes proposal tests. Mirrors
// /custom-elements/resources/custom-elements-helpers.js, which these tests
// also load for document_types() and the window helpers.

function create_attribute_log_entry(attribute, type) {
    return {type: type, attribute: attribute, element: attribute.ownerElement};
}

function assert_attribute_log_types(log, types, description) {
    assert_array_equals(log.types(), types, description);
}

function assert_constructed_entry(entry, attribute) {
    assert_equals(entry.type, 'constructed');
    assert_equals(entry.attribute, attribute);
}

function assert_connected_entry(entry, attribute, element) {
    assert_equals(entry.type, 'connected');
    assert_equals(entry.attribute, attribute);
    if (element !== undefined)
        assert_equals(entry.element, element, 'ownerElement during connectedCallback');
}

function assert_disconnected_entry(entry, attribute) {
    assert_equals(entry.type, 'disconnected');
    assert_equals(entry.attribute, attribute);
}

function assert_adopted_entry(entry, attribute, oldDocument, newDocument) {
    assert_equals(entry.type, 'adopted');
    assert_equals(entry.attribute, attribute);
    if (oldDocument !== undefined)
        assert_equals(entry.oldDocument, oldDocument, 'oldDocument');
    if (newDocument !== undefined)
        assert_equals(entry.newDocument, newDocument, 'newDocument');
}

function assert_attribute_changed_entry(entry, expected) {
    assert_equals(entry.type, 'attributeChanged');
    assert_equals(entry.argumentCount, 2, 'attributeChangedCallback must be given exactly two arguments');
    assert_equals(entry.oldValue, expected.oldValue, 'oldValue');
    assert_equals(entry.newValue, expected.newValue, 'newValue');
    if (expected.attribute !== undefined)
        assert_equals(entry.attribute, expected.attribute, 'attribute');
}

// Creates a logging Attr subclass without defining it. Returns {class, takeLog}.
function create_custom_attribute_class(window_ = window) {
    let log = [];

    class CustomAttribute extends window_.Attr {
        constructor() {
            super();
            log.push({type: 'constructed', attribute: this, element: this.ownerElement, value: this.value});
        }
        attributeChangedCallback(oldValue, newValue) {
            log.push({
                type: 'attributeChanged',
                attribute: this,
                element: this.ownerElement,
                argumentCount: arguments.length,
                oldValue: oldValue,
                newValue: newValue,
            });
        }
        connectedCallback() { log.push(create_attribute_log_entry(this, 'connected')); }
        disconnectedCallback() { log.push(create_attribute_log_entry(this, 'disconnected')); }
        adoptedCallback(oldDocument, newDocument) {
            log.push({type: 'adopted', attribute: this, element: this.ownerElement, oldDocument: oldDocument, newDocument: newDocument});
        }
    }

    return {
        class: CustomAttribute,
        takeLog: function () {
            let currentLog = log; log = [];
            currentLog.types = () => currentLog.map((entry) => entry.type);
            currentLog.last = () => currentLog[currentLog.length - 1];
            return currentLog;
        }
    };
}

// Defines a logging Attr subclass under name in the given registry
// (window.customAttributes by default) and returns {name, class, registry,
// takeLog}. A fresh name is generated when name is omitted.
function define_custom_attribute(name, registry, window_ = window) {
    registry = registry || window_.customAttributes;
    const custom = create_custom_attribute_class(window_);
    custom.name = name || 'custom-attribute-' + define_custom_attribute._attribute_number++;
    custom.registry = registry;
    registry.define(custom.name, custom.class);
    return custom;
}
define_custom_attribute._attribute_number = 1;

function define_new_custom_attribute(registry, window_ = window) {
    return define_custom_attribute(null, registry, window_);
}

// Removes the iframe of a document returned by document_types() once the test
// finishes, so that each run does not leak a browsing context.
function add_document_cleanup(test, doc) {
    if (doc === document || !doc.defaultView || !doc.defaultView.frameElement)
        return;
    const frame = doc.defaultView.frameElement;
    test.add_cleanup(() => frame.remove());
}

// Runs testFunction and asserts that it reports exactly one exception, without
// rethrowing it. expected is either the reported exception itself or, when it
// is a string, the name of the reported exception. Mirrors assert_reports in
// /custom-elements/Document-createElement.html, so the calling test file must
// use setup({allow_uncaught_exception: true}).
function assert_reports(expected, testFunction, message) {
    const reported = [];
    const previousHandler = window.onerror;
    window.onerror = function (msg, url, lineNumber, columnNumber, error) {
        reported.push(error);
        return true;
    };
    try {
        testFunction();
    } finally {
        window.onerror = previousHandler;
    }
    assert_equals(reported.length, 1, `${message}: exactly one exception must be reported`);
    if (typeof expected == 'string')
        assert_equals(reported[0].name, expected, message);
    else
        assert_equals(reported[0], expected, message);
}
