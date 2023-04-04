from base64 import decodebytes


def assert_pdf(value):
    data = decodebytes(value.encode())

    assert data.startswith(b"%PDF-"), "Decoded data should start with the PDF signature"
    assert data.endswith(b"%%EOF"), "Decoded data should end with the EOF flag"
