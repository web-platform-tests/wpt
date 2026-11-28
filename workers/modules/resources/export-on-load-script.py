import datetime

def main(request, response):
    # This script serves both preflight and main GET request for cross-origin
    # static imports from module service workers.
    # Access-Control-Allow-Headers is kept for user agents that still add the
    # `Service-Worker: script` request header to static imports. Per
    # https://w3c.github.io/ServiceWorker/#update-algorithm only the top-level
    # script request has that header (w3c/ServiceWorker#1574); see
    # service-workers/service-worker/service-worker-header-module.https.html.
    response_headers = [(b"Content-Type", b"text/javascript"),
                        (b"Access-Control-Allow-Origin", b"*"),
                        (b"Access-Control-Allow-Headers", b"Service-Worker")]

    body = b"export const importedModules = ['export-on-load-script.js'];"
    body += b"// %d" % datetime.datetime.now().timestamp()
    return (200, response_headers, body)
