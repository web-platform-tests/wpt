import socket
from unittest.mock import Mock

from wptserve import utils


def test_reserve_port_with_duplicate_addresses(monkeypatch):
    address = socket.getaddrinfo("localhost", 0, socket.AF_INET, socket.SOCK_STREAM)[0]
    monkeypatch.setattr(socket, "getaddrinfo", lambda *args, **kwargs: [address, address])
    with utils.reserve_tcp_port("localhost", set()) as sock:
        assert sock.getsockname()[1] != 0


def test_reserve_port_excludes_configured_and_bad_ports(monkeypatch):
    candidates = [Mock(spec=socket.socket) for _ in range(3)]
    for candidate, port in zip(candidates, [8000, 10080, 8001]):
        candidate.getsockname.return_value = ("127.0.0.1", port)
    monkeypatch.setattr(socket, "socket", Mock(side_effect=candidates))

    sock = utils.reserve_tcp_port("localhost", {8000})

    assert sock is candidates[2]
    candidates[0].close.assert_called_once()
    candidates[1].close.assert_called_once()
    candidates[2].close.assert_not_called()
