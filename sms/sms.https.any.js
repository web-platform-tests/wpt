// META: title=SMS Retriever API: Basics

'use strict';

promise_test(async t => {
  let receiver = new SMSReceiver();

  let watcher = new EventWatcher(t, receiver, ["change"]);

  await receiver.start();

  await watcher.wait_for("change");

  assert_equals("hello world", receiver.sms.content,
                'sms contents match what was received');
}, 'sms basics');
