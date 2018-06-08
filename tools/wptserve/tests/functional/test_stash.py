from wptserve.router import any_method
from wptserve.stash import StashServer
import uuid

import pytest

wptserve = pytest.importorskip("wptserve")


def test_put_take(server, request):
    with StashServer(None, authkey=str(uuid.uuid4())):
        @wptserve.handlers.handler
        def handler(request, response):
            if request.method == "POST":
                request.server.stash.put(request.POST.first("id"), request.POST.first("data"))
                data = "OK"
            elif request.method == "GET":
                data = request.server.stash.take(request.GET.first("id"))
                if data is None:
                    return "NOT FOUND"
            return data

        id = str(uuid.uuid4())
        route = (any_method, "/test/put_take", handler)
        server.router.register(*route)

        resp = request(route[1], method="POST", body={"id": id, "data": "Sample data"})
        assert resp.read() == "OK"

        resp = request(route[1], query="id=" + id)
        assert resp.read() == "Sample data"

        resp = request(route[1], query="id=" + id)
        assert resp.read() == "NOT FOUND"
