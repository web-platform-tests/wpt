/* Usage: include a div like:
 * <div id="status-warning"><p>This is a snapshot. The <a href=...>editor's draft</a> is the latest version. </div>
 * and somewhere after that, include the following:
 * <script src=http://dvcs.w3.org/hg/quirks-mode/raw-file/tip/status-warning.js async></script>
 * If you don't want the script to inject styles, use a data-no-style=""
 * attribute on the script element.
 */
(function(){
    if (!document.querySelector('script[data-no-style][src$="/status-warning.js"]')) {
        var style = document.createElement('style');
        style.textContent = '#status-warning { position:fixed; bottom:1em; left:0; right:0; } #status-warning > p { position:relative; width:35em; max-width:90%; box-sizing:border-box; margin:0 auto; background:lightgoldenrodyellow; border:1px solid; color:black; padding:0.5em 3em 0.5em 1em; border-radius:10px; box-shadow:0 10px 20px rgba(0, 0, 0, 0.5) } #status-warning > p > button { position:absolute; top:0; right:0; border-radius:0 9px; border-bottom:1px solid black; border-left:1px solid black; border-top:0; border-right:0; background:red; color:white; box-shadow:inset 0 -2px 2px rgba(0, 0, 0, 0.3), inset 0 2px 2px rgba(255, 255, 255, 0.6) }';
        document.head.appendChild(style);
    }
    function removeStatusWarning(store) {
        var elm = document.getElementById('status-warning');
        elm.parentNode.removeChild(elm);
        if (store && 'localStorage' in window)
            localStorage[document.querySelector('h1').textContent+' status warning closed'] = String(new Date()-0);
    }
    var div = document.getElementById('status-warning');
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'close';
    button.onclick = function() { removeStatusWarning(true); };
    div.querySelector('p').appendChild(button);
    var date;
    if ('localStorage' in window && (date = localStorage[document.querySelector('h1').textContent+' status warning closed'])) {
        if (new Date() - parseInt(date, 10) < 1000 * 60 * 60 * 24)
            removeStatusWarning();
    }
})();