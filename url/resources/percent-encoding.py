from six.moves.urllib.parse import unquote
from wptserve.utils import isomorphic_decode

# Use numeric references to let the HTML parser take care of inserting the correct code points
# rather than trying to figure out the necessary bytes for each encoding. (The latter can be
# especially tricky given that Python does not implement the Encoding Standard.)
def numeric_references(input):
    output = b""
    for cp in input:
        print cp
        output += b"&#x" + format(ord(cp), b"X") + b";"
    return output

def main(request, response):
    value = request.GET.first(b"value")
    encoding = request.GET.first(b"encoding")

    output_value = numeric_references(unquote(value).decode(b"utf-8"))
    return (
        [(b"Content-Type", b"text/html;charset=" + encoding)],
        b"""<!doctype html>
<a href="https://doesnotmatter.invalid/?%s#%s">test</a>
""" % (output_value, output_value))
