 # -*- coding: utf-8 -*-

def main(request, response):
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Expose-Headers", "X-Custom-Header, X-Custom-Header-Empty, X-Custom-Header-Comma, X-Custom-Header-Bytes");
    response.headers.append("Access-Control-Expose-Headers", "X-Second-Expose");
    response.headers.append("Access-Control-Expose-Headers", "Date");

    response.headers.set("Content-Type", "text/plain");

    response.headers.set("X-Custom-Header", "test");
    response.headers.set("X-Custom-Header", "test");
    response.headers.set("Set-Cookie", "test1=t1;max-age=2");
    response.headers.set("Set-Cookie2", "test2=t2;Max-Age=2");
    response.headers.set("X-Custom-Header-Empty", "");
    response.headers.set("X-Custom-Header-Comma", "1");
    response.headers.append("X-Custom-Header-Comma", "2");
    response.headers.set("X-Custom-Header-Bytes", "…");
    response.headers.set("X-Nonexposed", "unicorn");
    response.headers.set("X-Second-Expose", "flyingpig");

    #Simple response headers
    response.headers.set("Cache-Control", "no-cache");
    response.headers.set("Content-Language", "nn");
    response.headers.set("Expires", "Thu, 01 Dec 1994 16:00:00 GMT");
    response.headers.set("Last-Modified", "Thu, 01 Dec 1994 10:00:00 GMT");
    response.headers.set("Pragma", "no-cache");

    return "TEST"
