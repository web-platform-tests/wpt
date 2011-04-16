// Someone spec this before I go mad, please.
function isGreen(aElt) {
  if (document.defaultView && document.defaultView.getComputedStyle)
    return document.defaultView.getComputedStyle(aElt, '').color === "rgb(0, 128, 0)" || // Gecko & WebKit
           document.defaultView.getComputedStyle(aElt, '').color === "#008000"; // Presto
  if (aElt.currentStyle) // Trident
    return aElt.currentStyle.color === "green";
}
function isRed(aElt) {
  if (document.defaultView && document.defaultView.getComputedStyle)
    return document.defaultView.getComputedStyle(aElt, '').color === "rgb(256, 0, 0)" || // Gecko & WebKit
           document.defaultView.getComputedStyle(aElt, '').color.toLowerCase() === "#ff0000"; // Presto
  if (aElt.currentStyle) // Trident
    return aElt.currentStyle.color === "red";
}

