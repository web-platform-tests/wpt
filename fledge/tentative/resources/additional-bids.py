"""Endpoint to return additional bids in the appropriate response header.

Additional bids are returned using the "Ad-Auction-Additional-Bid" response
header, as described at
https://github.com/WICG/turtledove/blob/main/FLEDGE.md#63-http-response-headers.
This script generates one of those headers for each additional bid provided
in the body of the POST request. This script also deals with signing additional
bids using Ed25519 keys provided on the request. All requests to this endpoint
requires a "Sec-Ad-Auction-Fetch" request header with a value of b"?1";
this entrypoint otherwise returns a 400 response.
"""

import json
import base64
import binascii
import fledge.tentative.resources.ed25519 as ed25519
import fledge.tentative.resources.fledge_http_server_util as fledge_http_server_util

class BadRequestError(Exception):
  pass


def _generate_signature(base64_encoded_secret_key, message):
  """Returns a signature entry for a signed additional bid.

  Args:
    base64_encoded_secret_key: base64-encoded Ed25519 key with which to sign
        the message. From this secret key, the public key can be deduced, which
        becomes part of the signature entry.
    message: The additional bid text (or other text if generating an invalid
        signature) to sign.
  """
  secret_key = base64.b64decode(base64_encoded_secret_key.encode("utf-8"))
  public_key = ed25519.publickey(secret_key)
  signature = ed25519.signature(message.encode("utf-8"), secret_key, public_key)
  return {
      "key": base64.b64encode(public_key).decode("utf-8"),
      "signature": base64.b64encode(signature).decode("utf-8")
  }

def _sign_additional_bid(
    additional_bid,
    secret_keys_for_valid_signatures,
    secret_keys_for_invalid_signatures):
  """Returns a signed additional bid given an additional bid and secret keys.

  Args:
    additional_bid: JSON-decoded additional bid
    secret_keys_for_valid_signatures: a list of strings, each a base64-encoded
        Ed25519 secret key with which to sign the additional bid
    secret_keys_for_invalid_signatures: a list of strings, each a base64-encoded
        Ed25519 secret key with which to incorrectly sign the additional bid
  """
  additional_bid = json.dumps(additional_bid)
  signatures = ([_generate_signature(secret_key, additional_bid)
                 for secret_key in secret_keys_for_valid_signatures] +
                [_generate_signature(secret_key, "invalid" + additional_bid)
                 for secret_key in secret_keys_for_invalid_signatures])
  return json.dumps({
    "bid": additional_bid,
    "signatures": signatures
  })


def main(request, response):
  try:
    if fledge_http_server_util.handle_cors(request, response):
      return

    # Verify that Sec-Ad-Auction-Fetch is present
    if (request.headers.get("Sec-Ad-Auction-Fetch", default=b"").decode("utf-8") != "?1"):
      raise BadRequestError("Sec-Ad-Auction-Fetch missing or has an unexpected value; expected '?1'")

    auction_nonce = request.POST.get(b"auctionNonce", default=b"").decode("utf-8")
    if not auction_nonce:
      raise BadRequestError("Missing 'auctionNonce' post parameter")

    # Return each signed additional bid in its own header
    additional_bid_params = request.POST.get(b"additionalBidParams", default=b"").decode("utf-8")
    if not additional_bid_params:
      raise BadRequestError("Missing 'additionalBidParams' post parameter")
    for params in json.loads(additional_bid_params):
      signed_additional_bid = _sign_additional_bid(
          params["additionalBid"],
          params.get("secretKeysForValidSignatures", []),
          params.get("secretKeysForValidSignatures", []))
      additional_bid_header_value = auction_nonce.encode("utf-8") + b":" + base64.b64encode(signed_additional_bid.encode("utf-8"))
      response.headers.append(b"Ad-Auction-Additional-Bid", additional_bid_header_value)

    response.status = (200, b"OK")
    response.headers.set(b"Content-Type", b"text/plain")

  except BadRequestError as error:
    response.status = (400, b"Bad Request")
    response.headers.set(b"Content-Type", b"text/plain")
    response.content = str(error)

  except Exception as exception:
    response.status = (500, b"Internal Server Error")
    response.content = str(exception)
