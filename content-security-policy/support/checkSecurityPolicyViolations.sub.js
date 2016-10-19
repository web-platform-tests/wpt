var cspViolationReports = [];

// Injects a SecurityPolicyViolation event listener for the document.
document.addEventListener('securitypolicyviolation', function(violation) {
    cspViolationReports.push(violation);
});

// Asserts that no SecurityPolicyViolation event has been triggered.
function assert_no_violations() {
    assert_array_equals(cspViolationReports, [], 'No SecurityPolicyViolation event has been triggered.');
}

// Asserts that the expected number of violated directives has been received.
function assert_violations(expected) {
    var violations = {};
    cspViolationReports.forEach(violation => {
        var violatedDirective = violation['violatedDirective'].split(' ')[0];
        violations[violatedDirective] = (violations[violatedDirective] || 0) + 1;
    });

    assert_equals(JSON.stringify(violations), JSON.stringify(expected), 'Received the correct list of (violatedDirective, count) pairs in SecurityPolicyViolation events.');
}

// Asserts that the expected original policies (with no count, because it varies among browsers and even among different versions of the same browser) has been received.
function assert_original_policies(expected) {
    var originalPolicies = new Set();
    cspViolationReports.forEach(violation => {
        var originalPolicy = violation['originalPolicy'].trim();
        originalPolicies.add(originalPolicy);
    });

    assert_array_equals([...originalPolicies], expected, 'Received the correct list of original policies in SecurityPolicyViolation events.');
}
