/* Usage: include a link like:
 * <a href="https://www.w3.org/Bugs/Public/enter_bug.cgi?...">file a bug</a>
 * and somewhere after that, include the following:
 * <script src=http://dvcs.w3.org/hg/quirks-mode/raw-file/tip/file-bug.js async></script>
 * If you don't want the script to inject styles, use a data-no-style=""
 * attribute on the script element.
 */
(function(){
    var prevSelection='';
    var bugLink = document.createElement('a');
    bugLink.className = 'bug-link';
    bugLink.textContent = 'File a bug about the selected text';
    var link = document.querySelector('a[href^="https://www.w3.org/Bugs/Public/enter_bug.cgi?"]');
    link.parentNode.appendChild(bugLink);
    var originalHref = link.href;
    if (!document.querySelector('script[data-no-style][src$="/file-bug.js"]')) {
        var style = document.createElement('style');
        style.textContent = '.bug-link { position:fixed; bottom:0; left:0; background:rgba(255,255,255,0.8) !important; width:115px; font-size:smaller; padding:0 10px; z-index:1; visibility:hidden; opacity:0; transition:0.3s; text-decoration:underline } .bug-link[href] { visibility:visible; opacity:1 } .bug-link:not([href]) { color:gray }';
        document.head.appendChild(style);
    }
    onmouseup=onkeyup=function(e){
        var selectionObj = getSelection();
        var selection = String(selectionObj);
        if (selection == prevSelection)
            return;
        prevSelection = selection;
        if (selection == '') {
            bugLink.removeAttribute('href');
            bugLink.removeAttribute('accesskey');
            return;
        }
        var node = e.target;
        if (selectionObj.anchorNode) {
            node = selectionObj.anchorNode;
            if (selectionObj.focusNode && selectionObj.focusNode.compareDocumentPosition) {
                var compare = selectionObj.focusNode.compareDocumentPosition(selectionObj.anchorNode);
                if (compare == 20 || compare == 4) // descendant or following
                    node = selectionObj.focusNode;
            }
        }
        while (node && !node.id) {
            node = node.previousSibling || node.parentNode;
        }
        var summary = selection.replace(/\n/g, ' ');
        if (summary.length > 50)
            summary = summary.substr(0,47)+'...';
        if (selection.length > 1000)
            selection = selection.substr(0,997)+'...';
        var url = location.protocol+'//'+location.host+location.pathname+(node ? '#'+node.id : '');
        bugLink.href = originalHref + '&short_desc='+encodeURIComponent('"'+summary+'" ')+'&comment='+encodeURIComponent(url+'\n\n[[\n'+selection+'\n]]\n\n');
        bugLink.accessKey = '1';
    };
})();
