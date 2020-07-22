// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://w3c.github.io/webappsec-permissions-policy/

'use strict';

idl_test(
  ['permissions-policy'],
  ['reporting', 'html', 'dom'],
  idl_array => {
    idl_array.add_objects({
      PermissionsPolicy: ['document.permissionsPolicy'],
      // TODO: PermissionsPolicyViolationReportBody
    });
  }
);
