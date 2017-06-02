#!/usr/bin/python

TEMPLATE = """<!DOCTYPE html>
<meta charset="utf-8">
<title>%(title)s</title>
<link rel="author" title="Jochen Eisinger" href="mailto:jochen@chromium.org">
<link rel="help" href="https://html.spec.whatwg.org/multipage/semantics.html#downloading-resources">
<link rel="help" href="https://github.com/whatwg/html/issues/2622">
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>

<p>%(title)s</p>

<ol>
 <li><a href="%(url)s" download="foo.html">Click this link</a>.
 <li>Did a file get downloaded? <button>yes</button> <button>no</button>
</ol>

<div id="log"></div>

<script>
"use strict";

setup({explicit_timeout: true});

let clicked = false;

addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    clicked = true;
  } else if (event.target instanceof HTMLButtonElement) {
    if (!clicked) {
      document.getElementById("log").textContent = "Please click on the link first.";
      return;
    }
    assert_equals(event.target.textContent, "%(expected_result)s", "%(assert_description)s");
    done();
  }
});
</script>
"""

SAME_ORIGIN = "same-origin"
CROSS_ORIGIN = "cross-origin"

DONT_REDIRECT = "dont-redirect"
REDIRECT_SAME_ORIGIN = "redirect-same-origin"
REDIRECT_SWAP_ORIGIN = "redirect-swap-origin"

WITH_CONTENT_DISPOSITION = "with-content-disposition"
WITHOUT_CONTENT_DISPOSITION = "without-content-disposition"

DESCRIPTION = {
    SAME_ORIGIN: "same origin",
    CROSS_ORIGIN: "cross origin",
    DONT_REDIRECT: "",
    REDIRECT_SAME_ORIGIN: " (that redirects to that origin)",
    REDIRECT_SWAP_ORIGIN: " (that redirect to another origin)",
    WITH_CONTENT_DISPOSITION: "that replies with a Content-Disposition header",
    WITHOUT_CONTENT_DISPOSITION:
        "that replies without a Content-Disposition header",
}


def gen_html(request_origin, redirect, add_header):
    title = ("Download a %(origin)s URL%(redirect)s %(header)s from an a "
             "element." % {"origin": DESCRIPTION[request_origin],
                           "redirect": DESCRIPTION[redirect],
                           "header": DESCRIPTION[add_header]})

    expected_result = "yes"
    assert_description = "Download should work"
    # If the initiator and the final URL are cross orign, and there is no
    # content disposition header, the download should be refused.
    if add_header == WITHOUT_CONTENT_DISPOSITION:
        if ((request_origin == SAME_ORIGIN and redirect == REDIRECT_SWAP_ORIGIN) or
            (request_origin == CROSS_ORIGIN and redirect != REDIRECT_SWAP_ORIGIN)):
            expected_result = "no"
            assert_description = "Download should not work"

    path = "/html/semantics/downloading-resources/"
    same_origin = "http://{{host}}:{{location[port]}}" + path
    cross_origin = "http://{{domains[www1]}}:{{location[port]}}" + path

    if add_header == WITH_CONTENT_DISPOSITION:
        target_url = "resources/with-content-disposition.html"
    else:
        target_url = "resources/regular.html"

    if redirect == DONT_REDIRECT:
        redirector = "%(target_url)s"
    elif redirect == REDIRECT_SAME_ORIGIN:
        redirector = ("resources/regular.html?pipe=status(302)|" +
                      "header(Location,%(start_origin)s%(target_url)s)")
    else:
        redirector = ("resources/regular.html?pipe=status(302)|" +
                      "header(Location,%(swap_origin)s%(target_url)s)")

    if request_origin == SAME_ORIGIN:
        start_origin = same_origin
        swap_origin = cross_origin
    else:
        start_origin = cross_origin
        swap_origin = same_origin
    url = start_origin + (redirector % { "start_origin": start_origin,
                                         "swap_origin": swap_origin,
                                         "target_url": target_url })

    return TEMPLATE % { "title": title,
                        "url": url,
                        "expected_result": expected_result,
                        "assert_description": assert_description }


def main():
    for request_origin in (SAME_ORIGIN, CROSS_ORIGIN):
        for redirect in (DONT_REDIRECT, REDIRECT_SAME_ORIGIN,
                         REDIRECT_SWAP_ORIGIN):
            for add_header in (WITH_CONTENT_DISPOSITION,
                               WITHOUT_CONTENT_DISPOSITION):
                html = gen_html(request_origin, redirect, add_header)
                filename = ("a-download-%(request_origin)s-%(redirect)s-"
                            "%(add_header)s-manual.sub.html" % {
                                "request_origin": request_origin,
                                "redirect": redirect,
                                "add_header": add_header })
                with open(filename, "w") as f:
                    f.write(html)


if __name__ == '__main__':
    main()
