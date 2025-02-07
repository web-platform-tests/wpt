import json
from collections import namedtuple
from operator import attrgetter

from cbor2.decoder import loads as pyloads
from cbor2.encoder import dumps as pydumps

try:
    import _cbor2
except ModuleNotFoundError as e:
    if not str(e).startswith("No module"):
        load_exc = str(e)
    _cbor2 = None

Contender = namedtuple("Contender", "name,dumps,loads")

contenders = []


contenders.append(Contender("json", json.dumps, json.loads))


if _cbor2 is not None:
    contenders.append(Contender("ccbor2", _cbor2.dumps, _cbor2.loads))
else:
    contenders.append(Contender("ppcbor2", pydumps, pyloads))


# See https://github.com/pytest-dev/pytest-cov/issues/418
def pytest_configure(config):
    cov = config.pluginmanager.get_plugin("_cov")
    cov.options.no_cov = True
    if cov.cov_controller:
        cov.cov_controller.pause()


# See https://github.com/ionelmc/pytest-benchmark/issues/48


def pytest_benchmark_group_stats(config, benchmarks, group_by):
    result = {}
    for bench in benchmarks:
        engine, data_kind = bench["param"].split("-")
        group = result.setdefault("{}: {}".format(data_kind, bench["group"]), [])
        group.append(bench)
    return sorted(result.items())


def pytest_generate_tests(metafunc):
    if "contender" in metafunc.fixturenames:
        metafunc.parametrize("contender", contenders, ids=attrgetter("name"))
