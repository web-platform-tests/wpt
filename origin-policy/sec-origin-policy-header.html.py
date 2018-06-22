def main(request, response):
  """Send a response with the origin policy indicated by the ?policy= argument.

     Won't send a policy when the browser doesn't indicate support.
     It uses a default of "policy-1", so send an empty policy argument for no
     policy.
     The response contains an inline script and an eval-based script that will
     change the corresponding text from "no" to "yes", to allow easily testing
     of CSPs with "unsafe-inline" and "unsafe-eval".
  """
  origin_policy_header = "Sec-Origin-Policy"
  request_policy = request.headers.get(origin_policy_header)
  response_policy = request.GET.first("policy", default="policy-1")

  if request_policy and response_policy:
    response.headers.set(origin_policy_header, response_policy)
    response.headers.set("Vary", "sec-origin-policy")

  response.headers.set("Content-Type", "text/html");
  return """
    <html>
    <head>
     <title>Page with an Origin Policy</title>
     <style type="text/css">
       *[content="yes"] { color: green; }
       *[content="no"] { color: red; }
       *[content] { font-weight: bold; }
     </style>
    </head>
    <body>
    <p>What the server sees:</p>
    <ul>
      <li>secure: %s</li>
      <li>request policy: %s</li>
      <li>response policy: %s</li>
    </ul>
    <p>Reveal whether CSP with "unsafe-inline" or "unsafe-eval" is present:</p>
    <ul>
      <li>inline script allowed: <span id=scriptallowed>no</span></li>
      <li>eval allowed: <span id=evalallowed>no</span></li>
    </ul>
    <script type=text/javascript nonce=test>
      // Mirror content into content="..", so we can easily select in CSS.
      function mirror(elem) {
        elem.parentNode.setAttribute("content", elem.textContent);
      }
      for (elem of document.querySelectorAll("li span")) {
        elem.addEventListener("DOMSubtreeModified", e => mirror(e.target));
        mirror(elem);
      }
    </script>
    <script type=text/javascript>
      document.getElementById("scriptallowed").textContent = "yes";
      document.getElementById("evalallowed").textContent = eval("'yes'");
    </script>
    <script type=text/javascript nonce=test>
      if (window.parent) {
        window.parent.postMessage({
            script_allowed: document.getElementById("scriptallowed").textContent,
            eval_allowed: document.getElementById("evalallowed").textContent
          }, "*");
      }
    </script>
    </body>
    </html>
  """ % ("yes" if request.url_parts.scheme == "https" else "no",
         request_policy or "n/a", response_policy or "n/a")


