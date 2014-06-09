function getCSSImportRule() {
    var e = document.createElement('style'); 
    e.textContent = '@import "empty.css";';
    document.head.appendChild(e);
    return e.sheet.cssRules[0];
}