from base64 import decodebytes


def assert_pdf(value):
    data = decodebytes(value.encode())

    assert data.startswith(b"%PDF-"), "Decoded data should start with the PDF signature"
    # TODO: removed `data.endswith(b"%%EOF")` after https://crbug.com/1430371 is fixed.
    assert data.endswith(b"%%EOF\n") or data.endswith(b"%%EOF"), "Decoded data should end with the EOF flag"
