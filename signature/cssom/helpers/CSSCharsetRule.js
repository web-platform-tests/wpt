function getCSSCharsetRule() {
    var e = document.createElement('style'); 
    e.textContent = '@charset "utf-8";';
    document.head.appendChild(e);
    return e.sheet.cssRules[0];
}