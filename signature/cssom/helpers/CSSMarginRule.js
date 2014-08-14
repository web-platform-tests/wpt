"use strict";
function getCSSMarginRule() {
    var e = document.createElement('style'); 
    e.textContent = '@page { @top-left { content: "top left"; }';
    document.head.appendChild(e);
    var pageRule = e.sheet.cssRules[0];
    if (pageRule['cssRules'] === undefined)
        throw new InstantiationError('@page rule does not implement CSSGroupingRule');
    return pageRule.cssRules[0];
}