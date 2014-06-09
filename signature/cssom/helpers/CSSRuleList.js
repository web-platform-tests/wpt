function getCSSRuleList() {
    var e = document.createElement('style'); 
    document.head.appendChild(e);
    return e.sheet.cssRules;
}