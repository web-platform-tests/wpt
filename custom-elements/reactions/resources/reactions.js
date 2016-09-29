
let testNumber = 1;

function defineNewCustomElement(observedAttributes) {
    let log = [];
    let name = 'custom-element-' + testNumber++;

    class CustomElement extends HTMLElement {
        constructor() {
            super();
            log.push({type: 'constructed', element: this});
        }
        attributeChangedCallback(name, oldValue, newValue, namespace) {
            log.push({type: 'attributeChanged', element: this, name: name, oldValue: oldValue, newValue: newValue, namespace: namespace});
        }
        connectedCallback() { log.push({type: 'connected', element: this}); }
        disconnectedCallback() { log.push({type: 'disconnected', element: this}); }
        adoptedCallback(oldDocument, newDocument) { log.push({type: 'adopted', element: this, oldDocument: oldDocument, newDocument: newDocument}); }
    }
    CustomElement.observedAttributes = observedAttributes || ['id', 'title'];

    customElements.define(name, CustomElement);

    return {
        name: name,
        log: function () {
            let currentLog = log; log = [];
            return {
                types: () => currentLog.map((entry) => entry.type),
                log: (i) => currentLog[i == undefined ? currentLog.length - 1 : i],
            }
        }
    };
}

function testNodeConnector(testFunction, name) {
    let container = document.createElement('div');
    container.appendChild(document.createElement('div'));
    document.body.appendChild(container);
 
    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(container, instance);
        assert_array_equals(element.log().types(), ['connected']);
    }, name + ' must enqueue a connected reaction');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        assert_array_equals(element.log().types(), ['constructed']);
        var newDoc = document.implementation.createHTMLDocument();
        testFunction(container, instance);
        assert_array_equals(element.log().types(), ['connected']);
        testFunction(newDoc.documentElement, instance);
        assert_array_equals(element.log().types(), ['disconnected', 'adopted', 'connected']);
    }, name + ' must enqueue a disconnected reaction, an adopted reaction, and a connected reaction when the custom element was in another document');

    container.parentNode.removeChild(container);
}

function testNodeDisconnector(testFunction, name) {
    let container = document.createElement('div');
    container.appendChild(document.createElement('div'));
    document.body.appendChild(container);
 
    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        assert_array_equals(element.log().types(), ['constructed']);
        container.appendChild(instance);
        assert_array_equals(element.log().types(), ['connected']);
        testFunction(instance);
        assert_array_equals(element.log().types(), ['disconnected']);
    }, name + ' must enqueue a disconnected reaction');

    container.parentNode.removeChild(container);
}

function testReflectAttribute(jsAttributeName, contentAttributeName, validValue1, validValue2, name) {
    test(function () {
        var element = defineNewCustomElement([contentAttributeName]);
        var instance = document.createElement(element.name);
        assert_array_equals(element.log().types(), ['constructed']);
        instance[jsAttributeName] = validValue1;
        var logEntries = element.log();
        assert_array_equals(logEntries.types(), ['attributeChanged']);
        assert_equals(logEntries.log().name, contentAttributeName);
        assert_equals(logEntries.log().oldValue, null);
        assert_equals(logEntries.log().newValue, validValue1);
        assert_equals(logEntries.log().namespace, null);
    }, name + ' must enqueue a attributeChanged reaction when adding ' + contentAttributeName + ' content attribute');

    test(function () {
        var element = defineNewCustomElement([contentAttributeName]);
        var instance = document.createElement(element.name);
        instance[jsAttributeName] = validValue1;
        assert_array_equals(element.log().types(), ['constructed', 'attributeChanged']);
        instance[jsAttributeName] = validValue2;
        var logEntries = element.log();
        assert_array_equals(logEntries.types(), ['attributeChanged']);
        assert_equals(logEntries.log().name, contentAttributeName);
        assert_equals(logEntries.log().oldValue, validValue1);
        assert_equals(logEntries.log().newValue, validValue2);
        assert_equals(logEntries.log().namespace, null);
    }, name + ' must enqueue a attributeChanged reaction when replacing an existing attribute');
}

function testAttributeAdder(testFunction, name) {
    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(instance, 'id', 'foo');
        var logEntries = element.log();
        assert_array_equals(logEntries.types(), ['attributeChanged']);
        assert_equals(logEntries.log().name, 'id');
        assert_equals(logEntries.log().oldValue, null);
        assert_equals(logEntries.log().newValue, 'foo');
        assert_equals(logEntries.log().namespace, null);
    }, name + ' must enqueue a attributeChanged reaction when adding an attribute');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(instance, 'data-lang', 'en');
        assert_array_equals(element.log().types(), []);
    }, name + ' must not enqueue a attributeChanged reaction when adding an unobserved attribute');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        instance.setAttribute('title', 'hello');
        assert_array_equals(element.log().types(), ['constructed', 'attributeChanged']);
        testFunction(instance, 'title', 'world');
        var logEntries = element.log();
        assert_array_equals(logEntries.types(), ['attributeChanged']);
        assert_equals(logEntries.log().name, 'title');
        assert_equals(logEntries.log().oldValue, 'hello');
        assert_equals(logEntries.log().newValue, 'world');
        assert_equals(logEntries.log().namespace, null);
    }, name + ' must enqueue a attributeChanged reaction when replacing an existing attribute');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        instance.setAttribute('data-lang', 'zh');
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(instance, 'data-lang', 'en');
        assert_array_equals(element.log().types(), []);
    }, name + ' must enqueue a attributeChanged reaction when replacing an existing unobserved attribute');
}

function testAttributeMutator(testFunction, name) {
    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        instance.setAttribute('title', 'hello');
        assert_array_equals(element.log().types(), ['constructed', 'attributeChanged']);
        testFunction(instance, 'title', 'world');
        var logEntries = element.log();
        assert_array_equals(logEntries.types(), ['attributeChanged']);
        assert_equals(logEntries.log().name, 'title');
        assert_equals(logEntries.log().oldValue, 'hello');
        assert_equals(logEntries.log().newValue, 'world');
        assert_equals(logEntries.log().namespace, null);
    }, name + ' must enqueue a attributeChanged reaction when replacing an existing attribute');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        instance.setAttribute('data-lang', 'zh');
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(instance, 'data-lang', 'en');
        assert_array_equals(element.log().types(), []);
    }, name + ' must enqueue a attributeChanged reaction when replacing an existing unobserved attribute');
}

function testAttributeRemover(testFunction, name) {
    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(instance, 'title');
        assert_array_equals(element.log().types(), []);
    }, name + ' must not enqueue a attributeChanged reaction when removing an attribute that does not exist');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        instance.setAttribute('data-lang', 'hello');
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(instance, 'data-lang');
        assert_array_equals(element.log().types(), []);
    }, name + ' must not enqueue a attributeChanged reaction when removing an unobserved attribute that does not exist');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        instance.setAttribute('title', 'hello');
        assert_array_equals(element.log().types(), ['constructed', 'attributeChanged']);
        testFunction(instance, 'title');
        var logEntries = element.log();
        assert_array_equals(logEntries.types(), ['attributeChanged']);
        assert_equals(logEntries.log().name, 'title');
        assert_equals(logEntries.log().oldValue, 'hello');
        assert_equals(logEntries.log().newValue, null);
        assert_equals(logEntries.log().namespace, null);
    }, name + ' must enqueue a attributeChanged reaction when removing an existing attribute');

    test(function () {
        var element = defineNewCustomElement();
        var instance = document.createElement(element.name);
        instance.setAttribute('data-lang', 'ja');
        assert_array_equals(element.log().types(), ['constructed']);
        testFunction(instance, 'data-lang');
        assert_array_equals(element.log().types(), []);
    }, name + ' must not enqueue a attributeChanged reaction when removing an existing unobserved attribute');
}
