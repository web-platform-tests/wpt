function testDOMStringReflect(aIDLAttr, aContentAttr, aElement) {
  Test.is(typeof aElement[aIDLAttr], "string");

  aElement[aIDLAttr] = "abcde";
  Test.is(aElement[aIDLAttr], "abcde");
  Test.is(aElement.getAttribute(aContentAttr), "abcde");

  aElement.setAttribute(aContentAttr, "fghij");
  Test.is(aElement[aIDLAttr], "fghij");
  Test.is(aElement.getAttribute(aContentAttr), "fghij");

/*
  aElement[aIDLAttr] = null;
  Test.is(aElement[aIDLAttr], "null");
  Test.is(aElement.getAttribute(aContentAttr), "null");
  Test.is(aElement[aIDLAttr], "");
  Test.is(aElement.getAttribute(aContentAttr), "");
*/

  aElement[aIDLAttr] = undefined;
  Test.is(aElement[aIDLAttr], "undefined");
  Test.is(aElement.getAttribute(aContentAttr), "undefined");
}

function testBooleanReflect(aIDLAttr, aContentAttr, aElement) {
  Test.is(typeof aElement[aIDLAttr], "boolean");

  aElement[aIDLAttr] = true;
  Test.is(aElement[aIDLAttr], true);
  Test.is(aElement.getAttribute(aContentAttr), "");

  aElement[aIDLAttr] = false;
  Test.is(aElement[aIDLAttr], false);
  Test.is(aElement.hasAttribute(aContentAttr), false);

  aElement.setAttribute(aContentAttr, "banana");
  Test.is(aElement[aIDLAttr], true);
  Test.is(aElement.getAttribute(aContentAttr), "banana");

  aElement.removeAttribute(aContentAttr);
  Test.is(aElement[aIDLAttr], false);
  Test.is(aElement.hasAttribute(aContentAttr), false);
}

function testLongReflect(aIDLAttr, aContentAttr, aElement, aDefault) {
  Test.is(typeof aElement[aIDLAttr], "number");

  var mDefault = aDefault || 0;
  var min = -2147483648, max = 2147483647;
  aElement.removeAttribute(aContentAttr);
  Test.is(aElement[aIDLAttr], mDefault);
  aElement.setAttribute(aContentAttr, "" + (min - 1));
  Test.is(aElement[aIDLAttr], mDefault);
  aElement.setAttribute(aContentAttr, "" + (max + 1));
  Test.is(aElement[aIDLAttr], mDefault);
  aElement.setAttribute(aContentAttr, " ");
  Test.is(aElement[aIDLAttr], mDefault);
  aElement.setAttribute(aContentAttr, "-");
  Test.is(aElement[aIDLAttr], mDefault);
  aElement.setAttribute(aContentAttr, "+");
  Test.is(aElement[aIDLAttr], mDefault);

  aElement[aIDLAttr] = Infinity;
  Test.is(aElement.getAttribute(aContentAttr), "0");
  aElement[aIDLAttr] = -Infinity;
  Test.is(aElement.getAttribute(aContentAttr), "0");
  aElement[aIDLAttr] = NaN;
  Test.is(aElement.getAttribute(aContentAttr), "0");
  aElement[aIDLAttr] = 0;
  Test.is(aElement.getAttribute(aContentAttr), "0");
  aElement[aIDLAttr] = -0;
  Test.is(aElement.getAttribute(aContentAttr), "0");
  aElement[aIDLAttr] = 42;
  Test.is(aElement.getAttribute(aContentAttr), "42");
}
