def main(request, response):
    response.status = 302
    response.headers.set("Location", "test.window.js-newlocation.txt")
