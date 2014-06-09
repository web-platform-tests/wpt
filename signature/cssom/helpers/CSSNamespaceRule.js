function getCSSNamespaceRule() {
    var e = document.createElement('style'); 
    e.textContent = '@namespace svg "http://www.w3.org/2000/svg";';
    document.head.appendChild(e);
    return e.sheet.cssRules[0];
}