const prefixes = ["-moz-", "-ms-", "-o-", "-webkit-", ""];
const aligns = [
  ["center", "center"],
  ["middle", "center"],
  ["left", "left"],
  ["right", "right"],
  ["justify", "justify"]
];

function testElementAlignAttribute(element) {
  for (let [align, value] of aligns) {
    test(() => {
      let elem = document.getElementById(align);
      let css = window.getComputedStyle(elem, null).getPropertyValue("text-align");
      assert_not_equals(prefixes.map(x => x + value).indexOf(css), -1);
    }, `table ${element} align attribute ${align} is correct`)
  }
}

function testElementHeightAttribute(element) {
  test(() => {
    let elem = document.getElementById("pixel");
    let css = window.getComputedStyle(elem, null).getPropertyValue("height");
    assert_equals(css, "60px");
  }, `table ${element} height attribute pixel is correct`)

  test(() => {
    let elem = document.getElementById("percentage");
    let css = window.getComputedStyle(elem, null).getPropertyValue("height");
    assert_equals(css, "150px");
  }, `table ${element} height attribute percentage is correct`)
}
