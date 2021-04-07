#!/bin/sh

sxg_version=1b3
certfile=../../signed-exchange/resources/127.0.0.1.sxg.pem
keyfile=../../signed-exchange/resources/127.0.0.1.sxg.key
inner_url_origin=https://127.0.0.1:8444

set -e

if ! command -v gen-bundle > /dev/null 2>&1; then
    echo "gen-bundle is not installed. Please run:"
    echo "  go get -u github.com/WICG/webpackage/go/bundle/cmd/..."
    exit 1
fi

for cmd in gen-signedexchange gen-certurl dump-signedexchange; do
    if ! command -v $cmd > /dev/null 2>&1; then
        echo "$cmd is not installed. Please run:"
        echo "  go get -u github.com/WICG/webpackage/go/signedexchange/cmd/..."
        exit 1
    fi
done

tmpdir=$(mktemp -d)

echo -n OCSP >$tmpdir/ocsp
gen-certurl -pem $certfile -ocsp $tmpdir/ocsp > $tmpdir/cert.cbor

option="-w 0"
if [ "$(uname -s)" = "Darwin" ]; then
    option=""
fi

cert_base64=$(base64 ${option} ${tmpdir}/cert.cbor)

data_cert_url="data:application/cert-chain+cbor;base64,$cert_base64"

wbntmpdir=$(mktemp -d)

gen-signedexchange \
  -version $sxg_version \
  -uri $inner_url_origin/web-bundle/sxg-page.html \
  -status 200 \
  -content sxg-subframe-from-subresource-wbn/page.html \
  -certificate $certfile \
  -certUrl $data_cert_url \
  -validityUrl $inner_url_origin/web-bundle/sxg-page.html.validity.msg \
  -privateKey $keyfile \
  -date 2018-04-01T00:00:00Z \
  -expire 168h \
  -o $tmpdir/data-url-sxg.sxg \
  -miRecordSize 100

sxg_base64=$(base64 ${option} ${tmpdir}/data-url-sxg.sxg)
page_base64=$(base64 ${option} sxg-subframe-from-subresource-wbn/page.html)

cat <<EOF > $tmpdir/data-url-sxg.har
{
  "log": {
    "entries": [
      {
        "request": {
          "method": "GET",
          "url": "https://127.0.0.1:8444/web-bundle/sxg-page.html",
          "headers": []
        },
        "response": {
          "status": 200,
          "headers": [
            {
              "name": "Content-type",
              "value": "application/signed-exchange;v=b3"
            },
            {
              "name": "X-content-type-options",
              "value": "nosniff"
            }
          ],
          "content": {
            "text": "${sxg_base64}",
            "encoding": "base64"
          }
        }
      },
      {
        "request": {
          "method": "GET",
          "url": "https://127.0.0.1:8444/web-bundle/different-url.html",
          "headers": []
        },
        "response": {
          "status": 200,
          "headers": [
            {
              "name": "Content-type",
              "value": "application/signed-exchange;v=b3"
            },
            {
              "name": "X-content-type-options",
              "value": "nosniff"
            }
          ],
          "content": {
            "text": "${sxg_base64}",
            "encoding": "base64"
          }
        }
      },
      {
        "request": {
          "method": "GET",
          "url": "https://127.0.0.1:8444/web-bundle/page.html",
          "headers": []
        },
        "response": {
          "status": 200,
          "headers": [
            {
              "name": "Content-type",
              "value": "text/html"
            }
          ],
          "content": {
            "text": "${page_base64}",
            "encoding": "base64"
          }
        }
      }
    ]
  }
}
EOF

gen-bundle \
  -version b1 \
  -har $tmpdir/data-url-sxg.har \
  -primaryURL https://127.0.0.1:8444/web-bundle/sxg-page.html \
  -o wbn/sxg-subframe-from-subresource-wbn.wbn

rm -fr $tmpdir
