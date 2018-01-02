/* global add_completion_callback */
/* global setup */

/*
 * This file is intended for vendors to implement
 * code needed to integrate testharness.js tests with their own test systems.
 *
 * The default implementation extracts metadata from the tests and validates
 * it.
 *
 * Metadata is attached to tests via the properties parameter in the test
 * constructor. See testharness.js for details.
 *
 * Typically test system integration will attach callbacks when each test has
 * run, using add_result_callback(callback(test)), or when the whole test file
 * has completed, using
 * add_completion_callback(callback(tests, harness_status)).
 *
 * For more documentation about the callback functions and the
 * parameters they are called with see testharness.js
 */

var metadata_generator = {

    currentMetadata: {},
    metadataProperties: ['help', 'assert', 'author'],

    error: function(message) {
        var messageElement = document.createElement('p');
        messageElement.setAttribute('class', 'error');
        this.appendText(messageElement, message);

        var summary = document.getElementById('summary');
        if (summary) {
            summary.parentNode.insertBefore(messageElement, summary);
        }
        else {
            document.body.appendChild(messageElement);
        }
    },

    /**
     * Ensure property value has contact information
     */
    validateContact: function(test, propertyName) {
        var result = true;
        var value = test.properties[propertyName];
        var values = Array.isArray(value) ? value : [value];
        for (var index = 0; index < values.length; index++) {
            value = values[index];
            var re = /(\S+)(\s*)<(.*)>(.*)/;
            if (! re.test(value)) {
                re = /(\S+)(\s+)(http[s]?:\/\/)(.*)/;
                if (! re.test(value)) {
                    this.error('Metadata property "' + propertyName +
                        '" for test: "' + test.name +
                        '" must have name and contact information ' +
                        '("name <email>" or "name http(s)://")');
                    result = false;
                }
            }
        }
        return result;
    },

    /**
     * Extract metadata from test object
     */
    extractFromTest: function(test) {
        var testMetadata = {};
        // filter out metadata from other properties in test
        for (var metaIndex = 0; metaIndex < this.metadataProperties.length;
             metaIndex++) {
            var meta = this.metadataProperties[metaIndex];
            if (test.properties.hasOwnProperty(meta)) {
                if ('author' == meta) {
                    this.validateContact(test, meta);
                }
                testMetadata[meta] = test.properties[meta];
            }
        }
        return testMetadata;
    },

    appendText: function(elemement, text) {
        elemement.appendChild(document.createTextNode(text));
    },

    /**
     * Main entry point, extract metadata from tests.
     */
    process: function(tests) {
        for (var index = 0; index < tests.length; index++) {
            var test = tests[index];
            this.currentMetadata[test.name] = this.extractFromTest(test);
        }

        var message = null;
        var messageClass = 'warning';

        if (1 === tests.length) {
            var testMetadata = this.currentMetadata[tests[0].name];
            for (var meta in testMetadata) {
                if (testMetadata.hasOwnProperty(meta)) {
                    message = 'Single tests should not have metadata. ' +
                              'Move metadata to <head>. ';
                    break;
                }
            }
        }

        if (message) {
            var messageElement = document.createElement('p');
            messageElement.setAttribute('class', messageClass);
            this.appendText(messageElement, message);

            var summary = document.getElementById('summary');
            if (summary) {
                summary.parentNode.insertBefore(messageElement, summary);
            }
            else {
                var log = document.getElementById('log');
                if (log) {
                    log.appendChild(messageElement);
                }
            }
        }
    },

    setup: function() {
        add_completion_callback(
            function (tests, harness_status) {
                metadata_generator.process(tests, harness_status);
                dump_test_results(tests, harness_status);
            });
    }
};

function dump_test_results(tests, status) {
    var results_element = document.createElement("script");
    results_element.type = "text/json";
    results_element.id = "__testharness__results__";
    var test_results = tests.map(function(x) {
        return {name:x.name, status:x.status, message:x.message, stack:x.stack}
    });
    var data = {test:window.location.href,
                tests:test_results,
                status: status.status,
                message: status.message,
                stack: status.stack};
    results_element.textContent = JSON.stringify(data);

    // To avoid a HierarchyRequestError with XML documents, ensure that 'results_element'
    // is inserted at a location that results in a valid document.
    var parent = document.body
        ? document.body                 // <body> is required in XHTML documents
        : document.documentElement;     // fallback for optional <body> in HTML5, SVG, etc.

    parent.appendChild(results_element);
}

metadata_generator.setup();

/* If the parent window has a testharness_properties object,
 * we use this to provide the test settings. This is used by the
 * default in-browser runner to configure the timeout and the
 * rendering of results
 */
try {
    if (window.opener && "testharness_properties" in window.opener) {
        /* If we pass the testharness_properties object as-is here without
         * JSON stringifying and reparsing it, IE fails & emits the message
         * "Could not complete the operation due to error 80700019".
         */
        setup(JSON.parse(JSON.stringify(window.opener.testharness_properties)));
    }
} catch (e) {
}
// vim: set expandtab shiftwidth=4 tabstop=4:
