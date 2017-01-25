import urllib

def inline(document_source):
    return "data:text/html;charset=utf-8,%s" % urllib.quote(document_source)
