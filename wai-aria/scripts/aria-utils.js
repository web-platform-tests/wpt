/* Utilities related to WAI-ARIA */

const AriaUtils = {

  /*
  Tests simple role assignment: <div role="alert">x</div>
  Not intended for nest, context-dependent, or other complex roles.
  */
  assignAndVerifyRolesByRoleNames: function(roleNames) {
    for (const role of roleNames) {
      promise_test(async t => {
        let el = document.createElement("div");
        el.appendChild(document.createTextNode("x"));
        el.role = role;
        el.id = `role_${role}`;
        document.body.appendChild(el);
        const computedRole = await test_driver.get_computed_role(document.getElementById(el.id));
        assert_equals(computedRole, role, el.outerHTML);
      }, `role: ${role}`);
    }
  },

  /*
  Tests computed role of all elements matching selector
  against the string value of their data-role attribute.

  Ex: <div role="list" data-expectedrole="list" class="ex">
      AriaUtils.verifyRolesBySelector(".ex")

  */
  verifyRolesBySelector: function(selector) {
    let testCount = 0;
    const els = document.querySelectorAll(selector);

    for (const el of els) {
      testCount++;
      let role = el.getAttribute("data-expectedrole");
      promise_test(async t => {
        const expectedRole = el.getAttribute("data-expectedrole");

        // ensure ID uniqueness when testing multiple elements of the same role type
        if (!el.id) {
          let roleCount = 1;
          let elID = `${expectedRole}${roleCount}`;
          while(document.getElementById(elID)) {
            roleCount++;
            elID = `${expectedRole}${roleCount}`;
          }
          el.id = elID;
        }

        const computedRole = await test_driver.get_computed_role(document.getElementById(el.id));
        assert_equals(computedRole, expectedRole, el.outerHTML);
      }, `${testCount} ${role}`);
    }
  },

};

