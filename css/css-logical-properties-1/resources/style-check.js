"use strict";
function compareWidthHeight(id1, id2) {
  var element1 = document.getElementById(id1);
  var style1 = getComputedStyle(element1);
  var element2 = document.getElementById(id2);
  var style2 = getComputedStyle(element2);
  return (style1.width == style2.width) &&
      (style1.height == style2.height)
}

function compareBlockMargin_htb(id1, id2) {
  var element1 = document.getElementById(id1);
  var style1 = getComputedStyle(element1);
  var element2 = document.getElementById(id2);
  var style2 = getComputedStyle(element2);
  return (style1.marginBlockStart == style2.marginTop) &&
      (style1.marginBlockEnd == style2.marginBottom)
}

function compareBlockMargin_vertical(id1, id2) {
  var element1 = document.getElementById(id1);
  var style1 = getComputedStyle(element1);
  var element2 = document.getElementById(id2);
  var style2 = getComputedStyle(element2);
  var writingmode = style1.writingMode;
  if (writingmode == "vertical-lr") {
    return (style1.marginBlockStart == style2.marginLeft) &&
        (style1.marginBlockEnd == style2.marginRight)
  } else {
    return (style1.marginBlockStart == style2.marginRight) &&
        (style1.marginBlockEnd == style2.marginLeft)
  }
}

function compareInlineMargin_htb(id1, id2) {
  var element1 = document.getElementById(id1);
  var style1 = getComputedStyle(element1);
  var element2 = document.getElementById(id2);
  var style2 = getComputedStyle(element2);
  var direction = style1.direction;
  if (direction == "ltr") {
    return (style1.marginInlineStart == style2.marginLeft) &&
        (style1.marginInlineEnd == style2.marginRight)
  }
  else {
    return (style1.marginInlineStart == style2.marginRight) &&
        (style1.marginInlineEnd == style2.marginLeft)
  }
}

function compareInlineMargin_vertical(id1, id2) {
  var element1 = document.getElementById(id1);
  var style1 = getComputedStyle(element1);
  var element2 = document.getElementById(id2);
  var style2 = getComputedStyle(element2);
  var direction = style1.direction;
  if (direction == "ltr") {
    return (style1.marginInlineStart == style2.marginTop) &&
        (style1.marginInlineEnd == style2.marginBottom)
  }
  else {
    return (style1.marginInlineStart == style2.marginBottom) &&
        (style1.marginInlineEnd == style2.marginTop)
  }
}
