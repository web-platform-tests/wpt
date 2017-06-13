def main(request, response):
    return 404, [("Content-Type", "text/html")], """<!DOCTYPE html>
<html>
   <head>
    <script>parent.%s()</script>
   </head>
</html>
""" % request.GET.first('callbackName')
