// https://drafts.csswg.org/cssom/#dom-cssstyledeclaration-csstext

[
  document.body,
  document.createElement("cool-beans")
].forEach(element => {
  test(t => {
    t.add_cleanup(() => element.removeAttribute("style"));

    element.style.background = "red";
    assert_equals(element.getAttribute("style"), "background: red;");

    element.style.cssText = "background:red";
    assert_equals(element.getAttribute("style"), "background: red;");
  }, `cssText setter should set style attribute even when there are no style changes (${element.localName})`);

  test(t => {
    t.add_cleanup(() => element.removeAttribute("style"));

    element.setAttribute("style", "background:   red");
    assert_equals(element.getAttribute("style"), "background:   red");

    element.style.cssText = "background:red";
    assert_equals(element.getAttribute("style"), "background: red;");
  }, `cssText setter should set style attribute even when there are no style changes, part 2 (${element.localName})`);

  test(t => {
    t.add_cleanup(() => element.removeAttribute("style"));

    element.setAttribute("style", "background:   red");
    assert_equals(element.getAttribute("style"), "background:   red");

    element.style.cssText = "background:red "; // trailing space
    assert_equals(element.getAttribute("style"), "background: red;");
  }, `cssText setter should set style attribute even when there are no style changes, part 3 (${element.localName})`);

  test(t => {
    t.add_cleanup(() => element.removeAttribute("style"));

    element.setAttribute("style", "background:   red");
    assert_equals(element.getAttribute("style"), "background:   red");

    element.style.cssText = "background:red;";
    assert_equals(element.getAttribute("style"), "background: red;");
  }, `cssText setter should set style attribute even when there are no style changes, part 4 (${element.localName})`);
});
