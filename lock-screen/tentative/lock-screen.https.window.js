'use strict';

promise_test(async t => {
  let lockScreenData = await getLockScreenData();
  let keys = await lockScreenData.getKeys();
  assert_array_equals(keys, []);

  await lockScreenData.setData("key1", "data1");
  keys = await lockScreenData.getKeys();
  assert_array_equals(keys, ["key1"]);

  await lockScreenData.setData("key2", "data2");
  keys = await lockScreenData.getKeys();
  assert_array_equals(keys.sort(), ["key1", "key2"]);
}, 'getKeys works correctly');
