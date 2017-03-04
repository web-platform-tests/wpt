var position = [ "start", "end", "self-start", "self-end", "left", "right", "center", "flex-start", "flex-end"];
var distribution = [ "stretch", "space-around", "space-between", "space-evenly"];
var baseline = [ "baseline", "last-baseline"];

function checkPlaceContent(alignValue, justifyValue)
{
    var div = document.createElement("div");
    div.setAttribute("style", "place-content: " + alignValue + " " + justifyValue)
    document.body.appendChild(div);
    if (justifyValue.length == 0)
        justifyValue = alignValue;
    var style = getComputedStyle(div);
    assert_equals(style.getPropertyValue("place-content"),
                  alignValue + " " + justifyValue, "place-content resolved value");
    assert_equals(style.getPropertyValue("align-content"),
                  alignValue, "align-content resolved value");
    assert_equals(style.getPropertyValue("justify-content"),
                  justifyValue, "justify-content resolved value");
}
