# mypy: allow-untyped-defs

from unittest.mock import MagicMock

import pytest
from dnslib import RCODE
from dnslib.dns import DNSRecord

from .dns import Resolver


@pytest.mark.parametrize("destination, expected_qtype_str", [
    ("127.0.0.1", "A"),
    ("::1", "AAAA"),
])
def test_resolver_creates_correct_record_type(destination, expected_qtype_str):
    resolver = Resolver({"web-platform.test"}, destination)
    assert len(resolver.zone) == 1
    _, rtype, _ = resolver.zone[0]
    assert rtype == expected_qtype_str


@pytest.mark.parametrize("destination, qtype", [
    ("127.0.0.1", "A"),
    ("::1", "AAAA"),
])
def test_resolver_responds_to_matching_query(destination, qtype):
    resolver = Resolver({"web-platform.test"}, destination)
    reply = resolver.resolve(DNSRecord.question("web-platform.test.", qtype), MagicMock())
    assert reply.header.rcode == RCODE.NOERROR
    assert len(reply.rr) == 1


@pytest.mark.parametrize("destination, qtype", [
    ("127.0.0.1", "AAAA"),
    ("::1", "A"),
])
def test_resolver_returns_nxdomain_for_mismatched_query(destination, qtype):
    resolver = Resolver({"web-platform.test"}, destination)
    reply = resolver.resolve(DNSRecord.question("web-platform.test.", qtype), MagicMock())
    assert reply.header.rcode == RCODE.NXDOMAIN


def test_resolver_raises_for_non_ip_destination():
    with pytest.raises(ValueError):
        Resolver({"web-platform.test"}, "not-an-ip")
