function checkRecords(target, sequence1, sequence2) {
  assert_equals(sequence1.length, sequence2.length, "mutation records must match");
  for (var item = 0; item < sequence1.length; item++) {
    var mr1 = sequence1[item];
    var mr2 = sequence2[item];

    assert_equals(mr1.type, mr2.type);
    if (mr2.target !== undefined) {
      assert_equals(mr1.target, mr2.target);
    } else {
      assert_equals(mr1.target, target);
    }
    if (mr2.addedNodes instanceof Array) {
      assert_array_equals(mr1.addedNodes, mr2.addedNodes, "addedNodes must match");
    } else if (mr2.addedNodes instanceof Function) {
      assert_array_equals(mr1.addedNodes, mr2.addedNodes(), "addedNodes must match");
    } else {
      assert_array_equals(mr1.addedNodes, new Array(), "addedNodes must be empty");
    }
    if (mr2.removedNodes instanceof Array) {
      assert_array_equals(mr1.removedNodes, mr2.removedNodes, "removedNodes must match");
    } else if (mr2.removedNodes instanceof Function) {
      assert_array_equals(mr1.removedNodes, mr2.removedNodes(), "removedNodes must match");
    } else {
      assert_array_equals(mr1.removedNodes, new Array(), "removedNodes must be empty");
    }
    if (mr2.previousSibling instanceof Function) {
      assert_equals(mr1.previousSibling, mr2.previousSibling(), "previousSibling must match");
    } else if (mr2.previousSibling !== undefined) {
      assert_equals(mr1.previousSibling, mr2.previousSibling, "previousSibling must match");
    } else {
      assert_equals(mr1.previousSibling, null, "previousSibling must be null");
    }
    if (mr2.nextSibling instanceof Function) {
      assert_equals(mr1.nextSibling, mr2.nextSibling(), "nextSibling must match");
    } else if (mr2.nextSibling !== undefined) {
      assert_equals(mr1.nextSibling, mr2.nextSibling, "nextSibling must match");
    } else {
      assert_equals(mr1.nextSibling, null, "nextSibling must be null");
    }
    if (mr2.attributeName !== undefined) {
      assert_equals(mr1.attributeName, mr2.attributeName, "attributeName must match");
    } else {
      assert_equals(mr1.attributeName, null, "attributeName must be null");
    }
    if (mr2.attributeNamespace !== undefined) {
      assert_equals(mr1.attributeNamespace, mr2.attributeNamespace, "attributeNamespace must match");
    } else {
      assert_equals(mr1.attributeNamespace, null, "attributeNamespace must be null");
    }
    if (mr2.oldValue !== undefined) {
      assert_equals(mr1.oldValue, mr2.oldValue, "oldValue must match");
    } else {
      assert_equals(mr1.oldValue, null, "oldValue must be null");
    }
  };
}

function runMutationTest(node, mutationObserverOptions, mutationRecordSequence, mutationFunction, description, target) {
  var test = async_test(description);


  function moc(mrl, obs) {
    test.step(
      function () {
            if (target === undefined) target = node;
            checkRecords(target, mrl, mutationRecordSequence);
        test.done();
      }
     );
  }

  test.step(
     function () {
        (new MutationObserver(moc)).observe(node, mutationObserverOptions);
         mutationFunction();
    }
  );
  return mutationRecordSequence.length
}
