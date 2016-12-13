def main(request, response):
    headers = [("Content-Type", "text/html")]
    if "policy" in request.GET:
        headers.append(("Content-Security-Policy", request.GET["policy"].replace("8", ";")))
    if "policy2" in request.GET:
        headers.append(("Content-Security-Policy", request.GET["policy2"].replace("8", ";")))
    message = request.GET["id"]
    return headers, '''
<!DOCTYPE html>
<html>
<head>
    <title>This page enforces embedder's policies</title>
    <script nonce="123">
        document.addEventListener("securitypolicyviolation", function(e) {
            var response = {};
            response["id"] = "%s";
            response["securitypolicyviolation"] = true;
            response["blockedURI"] = e.blockedURI;
            response["lineNumber"] = e.lineNumber;
            window.top.postMessage(response, '*');
        });
    </script>
</head>
<body>
    <style>
        body {
            background-color: maroon;
        }
    </style>
    <script nonce="abc"> 
        var response = {};
        response["id"] = "%s";
        response["loaded"] = true;
        window.top.postMessage(response, '*');
    </script>
</body>
</html>
''' % (message, message)
