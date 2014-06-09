function getCSSMediaRule() {
    var e = document.createElement('style'); 
    e.textContent = '@media all { #id {} }';
    document.head.appendChild(e);
    return e.sheet.cssRules[0];
}