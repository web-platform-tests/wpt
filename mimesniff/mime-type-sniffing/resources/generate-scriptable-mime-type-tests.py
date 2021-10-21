#!/usr/bin/env python3

import collections
import json

#####

BINARY_DATA_BYTES = ( b"\x00", b"\x01", b"\x02", b"\x03", b"\x04", b"\x05", b"\x06", b"\x07", b"\x08", b"\x0B", b"\x0E", b"\x0F", b"\x10", b"\x11", b"\x12", b"\x13", b"\x14", b"\x15", b"\x16", b"\x17", b"\x18", b"\x19", b"\x1A", b"\x1C", b"\x1D", b"\x1E", b"\x1F" )
WHITESPACE_BYTES = ( b"\x09", b"\x0A", b"\x0C", b"\x0D", b"\x20" )
TAG_TERMINATING_BYTES = ( b"\x20", b"\x3E" )

#####

unknown_content_types = [
  None,
  "",
  "bogus",
  "*/*",
  "unknown/unknown",
  "application/unknown",
]

PatternTuple = collections.namedtuple("PatternTuple", [ "is_scriptable", "byte_pattern", "pattern_mask", "ignore_leading_whitespace", "computed_mime_type" ])

pattern_tuples = [
  PatternTuple( True, "3C 21 44 4F 43 54 59 50 45 20 48 54 4D 4C TT", "FF FF DF DF DF DF DF DF DF FF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 48 54 4D 4C TT", "FF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 48 45 41 44 TT", "FF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 53 43 52 49 50 54 TT", "FF DF DF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 49 46 52 41 4D 45 TT", "FF DF DF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 48 31 TT", "FF DF FF FF", True, "text/html" ),
  PatternTuple( True, "3C 44 49 56 TT", "FF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 46 4F 4E 54 TT", "FF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 54 41 42 4C 45 TT", "FF DF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 41 TT", "FF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 53 54 59 4C 45 TT", "FF DF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 54 49 54 4C 45 TT", "FF DF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 42 TT", "FF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 42 4F 44 59 TT", "FF DF DF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 42 52 TT", "FF DF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 50 TT", "FF DF FF", True, "text/html" ),
  PatternTuple( True, "3C 21 2D 2D TT", "FF FF FF FF FF", True, "text/html" ),
  PatternTuple( True, "3C 3F 78 6D 6C", "FF FF FF FF FF", True, "text/xml" ),
  PatternTuple( True, "25 50 44 46 2D", "FF FF FF FF FF", False, "application/pdf" ),
  PatternTuple( False, "25 21 50 53 2D 41 64 6F 62 65 2D", "FF FF FF FF FF FF FF FF FF FF FF", False, "application/postscript" ),
  PatternTuple( False, "FE FF 00 00", "FF FF 00 00", False, "text/plain" ),
  PatternTuple( False, "FF FE 00 00", "FF FF 00 00", False, "text/plain" ),
  PatternTuple( False, "EF BB BF 00", "FF FF FF 00", False, "text/plain" ),
]

#####

def byte_pattern_is_binary(byte_pattern: str) -> bool:
  return any([ dbd.hex().upper() in byte_pattern for dbd in BINARY_DATA_BYTES ])

def get_description(byte_pattern: str, content_type: str, nosniff: bool) -> str:
  pattern_bytes: bytes = bytes.fromhex(payload)

  description: str
  if byte_pattern_is_binary(byte_pattern):
    description = repr(pattern_bytes)
  else:
    description = repr(pattern_bytes.decode())

  if content_type is None:
    description += " with no Content-Type"
  elif content_type == "":
    description += " with empty Content-Type"
  else:
    description += f" with '{content_type}' Content-Type"

  if nosniff:
    description += " and nosniff"

  return description

def get_safe_expected_mime_type(byte_pattern: str) -> str:
  return "application/octet-stream" if byte_pattern_is_binary(byte_pattern) else "text/plain"

#####

tests = []

for content_type in unknown_content_types:
  for pattern_tuple in pattern_tuples:
    ignored_byte_prefixes = [ None ]

    if pattern_tuple.ignore_leading_whitespace:
      ignored_byte_prefixes.append(" ".join([ ws.hex().upper() for ws in WHITESPACE_BYTES ]))

      for whitespace_byte in WHITESPACE_BYTES:
        ignored_byte_prefixes.append(" ".join([ whitespace_byte.hex().upper() ] * len(WHITESPACE_BYTES)))

    for ignored_byte_prefix in ignored_byte_prefixes:
      for tag_terminating_byte in ( None, ) + TAG_TERMINATING_BYTES:
        for nosniff in (False, True):
          # Don't attempt to generate a separate test expanding 'TT' if it's not even in the byte pattern.
          if tag_terminating_byte is not None and "TT" not in pattern_tuple.byte_pattern:
            continue

          # Indicates that this is a derived pattern that should *NOT* match the expected MIME type.
          pattern_does_not_match: bool = (tag_terminating_byte is None and "TT" in pattern_tuple.byte_pattern)

          payload: str = pattern_tuple.byte_pattern.replace("TT", "" if tag_terminating_byte is None else tag_terminating_byte.hex().upper()).strip()

          if ignored_byte_prefix is not None:
            payload = ignored_byte_prefix + " " + payload

          headers = []

          if content_type is not None:
            headers.append([ "Content-Type", content_type ])

          if nosniff:
            headers.append([ "X-Content-Type-Options", "nosniff" ])

          if pattern_tuple.is_scriptable and nosniff:
            expected_mime_type = get_safe_expected_mime_type(payload)
          else:
            expected_mime_type = get_safe_expected_mime_type(payload) if pattern_does_not_match else pattern_tuple.computed_mime_type

          # Ternary setting:
          # False = Download Forbidden
          # None = Download Allowed
          # True = Download Required
          if expected_mime_type in { "text/plain", "text/html", "text/xml" }:
            download_expectation = False
          elif expected_mime_type in { "application/octet-stream", "application/postscript" }:
            download_expectation = True
          else:
            download_expectation = None

          test = {
            "description": get_description(payload, content_type, nosniff),
            "expected_mime_type": expected_mime_type,
            "download_expectation": download_expectation,
            "headers": headers,
            "payload": payload,
          }

          tests.append(test)

#####

with open("scriptable-mime-types.json", "w", encoding="utf-8") as json_file:
  json.dump(tests, json_file, indent=2, separators=(",", ": "))
