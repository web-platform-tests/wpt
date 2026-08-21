// https://github.com/whatwg/html/issues/12279
test(() => {
  window.script_did_run = false;

  const script = document.createElement('script');

  // This prevents execution on insertion.
  script.type = '0';

  const text = document.createTextNode('script_did_run = true;');
  script.append(text);
  document.body.append(script);
  assert_false(script_did_run,
      'Appending script with invalid type does not trigger execution');

  // This enables, but does not trigger, execution.
  script.type = '';
  assert_false(script_did_run,
      'Unsetting script type does not trigger execution');

  text.data = 'script_did_run = true;';
  assert_false(script_did_run,
      'Setting CharacterData.data does not trigger execution');

  text.appendData(' /* still should not run */');
  assert_false(script_did_run,
      'appendData() does not trigger execution');

  text.replaceData(0, text.length, 'script_did_run = true;');
  assert_false(script_did_run,
      'replaceData() does not trigger execution');

  text.deleteData(text.length - 1, 1);
  assert_false(script_did_run,
      'deleteData() does not trigger execution');
}, "Script execution is never triggered on child mutation");
