from cgi import escape

def main(request, response):
    data = """<!doctype html>
    <html>
            <head>
                    <title>history.pushState/replaceState and referer headers (before onload)</title>
            </head>
            <body>

                    <noscript><p>Enable JavaScript and reload</p></noscript>
                    <div id="log"></div>
                    <script type="text/javascript">
    var httpReferer = "%s";
    var lastUrl = location.href.replace(/\/[^\/]*$/,'\/010-2.html?1234');
    parent.test(function () {
            parent.assert_equals( httpReferer, lastUrl );
    }, 'HTTP Referer should use the pushed state (before onload)');
    parent.test(function () {
            parent.assert_equals( document.referrer, lastUrl );
    }, 'document.referrer should use the pushed state (before onload)');
    try { history.pushState('','','010-4.html?2345'); } catch(e) {}
    location.href = '010-5.py';
                    </script>

            </body>
    </html>"""

    referrer = request.headers.get("referer", "")

    return [("Content-Type", "text/html")], data % escape(referrer)
