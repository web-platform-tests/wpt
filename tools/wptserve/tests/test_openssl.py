import pytest

from wptserve.sslutils.openssl import (
    OpenSSLEnvironment,
    make_alt_names,
    make_name_constraints,
)


@pytest.mark.parametrize("hosts, expected", [
    (["web-platform.test"], "DNS:web-platform.test"),
    (["127.0.0.1"], "IP:127.0.0.1"),
    (["2001:db8::1"], "IP:2001:db8::1"),
    (["web-platform.test", "127.0.0.1", "::1", "www.127.0.0.1"],
     "DNS:web-platform.test,IP:127.0.0.1,IP:::1,DNS:www.127.0.0.1"),
])
def test_make_alt_names(hosts, expected):
    assert make_alt_names(hosts) == expected


@pytest.mark.parametrize("hosts, expected", [
    (["web-platform.test"], "permitted;DNS:web-platform.test"),
    (["127.0.0.1"], "permitted;IP:127.0.0.1/255.255.255.255"),
    (["2001:db8::1"],
     "permitted;IP:2001:db8::1/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"),
    (["web-platform.test", "127.0.0.1", "::1", "www.127.0.0.1"],
     "permitted;DNS:web-platform.test,"
     "permitted;IP:127.0.0.1/255.255.255.255,"
     "permitted;IP:::1/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff,"
     "permitted;DNS:www.127.0.0.1"),
])
def test_make_name_constraints(hosts, expected):
    assert make_name_constraints(hosts) == expected


def test_additional_hosts_follow_configured_hosts():
    environment = OpenSSLEnvironment(
        None,
        base_path="unused",
        additional_hosts=["127.0.0.1", "web-platform.test"],
    )

    assert environment._certificate_hosts({
        "not-web-platform.test",
        "web-platform.test",
    }) == (
        "web-platform.test",
        "not-web-platform.test",
        "127.0.0.1",
    )
