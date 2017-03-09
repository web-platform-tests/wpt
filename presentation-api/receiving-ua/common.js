(window => {
  // Both a controlling side and a receiving one must share the same Stash ID to
  // transmit data from one to the other. On the other hand, due to polling mechanism
  // which cleans up a stash, stashes in both controller-to-receiver direction
  // and one for receiver-to-controller are necessary.
  window.stashIds = {
    toController: '0c382524-5738-4df0-837d-4f53ea8addc2',
    toReceiver: 'a9618cd1-ca2b-4155-b7f6-630dce953c44'
  }

  // handle a test result received from a receiving page
  const parseValue = value => {
    let r;

    // String
    if (r = value.match(/^"(.*)"$/))
      return r[1];
    // Object
    else if (r = value.match(/^object\s+"\[object\s+(.*)\]"$/))
      return window[r[1]].prototype;
    // Number, boolean, null, undefined
    else
      return JSON.parse(value);
  };

  window.parseResult = message => {
    let r = message.match(/^(assert_.*):\s+(.*)$/);
    const assertion = r[1];
    const body = r[2];
    switch (assertion) {
      case 'assert_equals':
        r = body.match(/^(.*)\s+expected\s+(true|false|null|\d+|"(.*)")\s+but\s+got\s+(true|false|null|\d+|(object\s+)?"(.*)")$/);
        window[assertion](parseValue(r[4]), parseValue(r[2]), r[1]);
        break;
      case 'assert_true':
      case 'assert_false':
        r = body.match(/^(.*)\s+expected\s+(true|false)\s+got\s+(true|false)$/);
        window[assertion](parseValue(r[3]), r[1]);
        break;
      case 'assert_unreached':
        r = body.match(/^(.*)\s+Reached\s+unreachable\s+code$/);
        window[assertion](r[1]);
        break;
    }
  };
})(window);