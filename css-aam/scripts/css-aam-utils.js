/* Utilities related to CSS-AAM */

const CssAamUtils = {
    /*
      Clones test container template.

      */
    cloneTestContainer: function(templateID, containerID) {
        let template = document.querySelector(`#${templateID}`);
        let container = document.body.appendChild(document.createElement("div"));
        container.id = containerID;
        container.appendChild(template.content.cloneNode(true));

        return container
    },

    /*
      Replaces white space with dashes.

      */
    escapeWhiteSpace: function(value) {
        return value.replace(/\W/, "-");
    },

    /*
      Tests unchanged implicit role with display value: <button style="display: flex">x</div>

      Ex: CssAamUtils.verifyRolesBySelectorWithDisplayValue(".ex", "inline-table")

      */
    verifyRolesBySelectorWithDisplayValue: function(selector, displayValue) {
        const escapedDisplay = CssAamUtils.escapeWhiteSpace(displayValue);
        const containerID = `display-${escapedDisplay}`;
        const container = CssAamUtils.cloneTestContainer("template", containerID);
        const containerSelector = `#${container.id} ${selector}`;
        const els = document.querySelectorAll(containerSelector);

        if (!els.length) {
          throw `Selector passed in verifyRolesBySelector("${containerSelector}") should match at least one element.`;
        }

        for (const el of els) {
          if (!el.hasAttribute("data-expectedrole")) {
            throw `Element should have attribute 'data-expectedrole'. Element: ${el.outerHTML}`;
          }

          el.style.display = displayValue;
          let testNameBase = el.dataset.testnamebase;
          let role = el.getAttribute("data-expectedrole");
          let testName = `${testNameBase}-with-display-${escapedDisplay}`;
          promise_test(async t => {
            const expectedRole = el.getAttribute("data-expectedrole");
            const computedRole = await test_driver.get_computed_role(el);
            assert_equals(computedRole, expectedRole, el.outerHTML);
          }, `${testName}`);
        }
    },

    /*
      Tests unchanged implicit generic role with display value: <button style="display: flex">x</div>

      Ex: CssAamUtils.verifyGenericRolesBySelectorWithDisplayValue(".ex", ["group", "main", "button"], "block flow")

      */
    verifyGenericRolesBySelectorWithDisplayValue: function(selector, roles, displayValue) {
        const escapedDisplay = CssAamUtils.escapeWhiteSpace(displayValue);
        const containerID = `display-${escapedDisplay}`;
        const container = CssAamUtils.cloneTestContainer("template", containerID);
        const containerSelector = `#${container.id} ${selector}`;
        const els = document.querySelectorAll(containerSelector);

        if (!els.length) {
          throw `Selector passed in verifyRolesBySelector("${containerSelector}") should match at least one element.`;
        }
        if (!roles.length || roles.length < 2) {
          throw `Roles array ["${roles.join('", "')}"] should include at least two strings, a primary role and at least one acceptable implementation-specific variant. E.g. ["generic", "", "none"]…`;
        }

        for (const el of els) {
          el.style.display = displayValue;
          const expectedRoles = roles;
          let testNameBase = el.dataset.testnamebase;
          let testName = `${testNameBase}-with-display-${escapedDisplay}`;
          promise_test(async t => {
            const expectedRoles = roles;
            const computedRole = await test_driver.get_computed_role(el);
            for (role of roles){
              if (computedRole === role) {
                return assert_equals(computedRole, role, `Computed Role: "${computedRole}" matches one of the acceptable role strings in ["${roles.join('", "')}"]: ${el.outerHTML}`);
              }
            }
            return assert_false(true, `Computed Role: "${computedRole}" does not match any of the acceptable role strings in ["${roles.join('", "')}"]: ${el.outerHTML}`);
          }, `${testName}`);
        }
    }
}
