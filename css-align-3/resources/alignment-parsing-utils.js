var position = [ "start", "end", "left", "right", "center", "flex-start", "flex-end"];
var distribution = [ "stretch", "space-around", "space-between", "space-evenly"];
var baseline = [ "baseline", "last-baseline"];

function checkPlaceContent(alignVal, justifyVal)
{
    var div = document.createElement("div");
    div.setAttribute("style", "place-content: " + alignVal + " " + justifyVal)
    document.body.appendChild(div);
    if (justifyVal.length == 0)
        justifyVal = alignVal;
    var cs = getComputedStyle(div, null);
    assert_equals(cs.getPropertyValue("place-content"),
                  alignVal + " " + justifyVal, "place-content computed value");
    assert_equals(cs.getPropertyValue("align-content"),
                  alignVal, "align-content computed value");
    assert_equals(cs.getPropertyValue("justify-content"),
                  justifyVal, "justify-content computed value");
}
