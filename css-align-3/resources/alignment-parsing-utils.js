var selfPositionValues = [ "start", "end", "self-start", "self-end", "left", "right", "center", "flex-start", "flex-end"];
var contentPositionValues = [ "start", "end", "left", "right", "center", "flex-start", "flex-end"];
var distributionValues = [ "stretch", "space-around", "space-between", "space-evenly"];
var baselineValues = [ "baseline", "first baseline", "last baseline"];

function checkPlaceContent(alignValue, justifyValue = "")
{
    checkPlaceShorhand("place-content", "align-content", "justify-content", alignValue, justifyValue);
}

function checkPlaceItems(alignValue, justifyValue = "")
{
    checkPlaceShorhand("place-items", "align-items", "justify-items", alignValue, justifyValue);
}

function checkPlaceShorhand(shorthand, alignLonghand, justifyLonghand, alignValue, justifyValue = "")
{
    var div = document.createElement("div");
    div.setAttribute("style", shorthand + ": " + alignValue + " " + justifyValue);
    document.body.appendChild(div);
    if (justifyValue === "")
        justifyValue = alignValue;
    var style = getComputedStyle(div);
    assert_equals(style.getPropertyValue(shorthand),
                  alignValue + " " + justifyValue, shorthand + " resolved value");
    assert_equals(style.getPropertyValue(alignLonghand),
                  alignValue, alignLonghand + " resolved value");
    assert_equals(style.getPropertyValue(justifyLonghand),
                  justifyValue, justifyLonghand + " resolved value");
}
