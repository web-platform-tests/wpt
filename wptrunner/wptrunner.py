# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import unicode_literals

import hashlib
import json
import logging
import os
import shutil
import socket
import sys
import threading
import time
import traceback
import urlparse
from StringIO import StringIO
from collections import defaultdict, OrderedDict
from multiprocessing import Queue

import moznetwork
from mozlog.structured import structuredlog, commandline, stdadapter
from mozlog.structured.formatters import JSONFormatter
from mozlog.structured.handlers import StreamHandler
from mozprocess import ProcessHandler

import manifestexpected
import manifestinclude
import metadata
import products
import wptcommandline
import wpttest
from testrunner import ManagerGroup

here = os.path.split(__file__)[0]


# TODO
# Multiplatform expectations
# Documentation
# HTTP server crashes

"""Runner for web-platform-tests

The runner has several design goals:

* Tests should run with no modification from upstream.

* Tests should be regarded as "untrusted" so that errors, timeouts and even
  crashes in the tests can be handled without failing the entire test run.

* For performance tests can be run in multiple browsers in parallel.

The upstream repository has the facility for creating a test manifest in JSON
format. This manifest is used directly to determine which tests exist. Local
metadata files are used to store the expected test results.

"""

logger = None


def setup_logging(args, defaults):
    global logger
    setup_compat_args(args)
    logger = commandline.setup_logging("web-platform-tests", args, defaults)
    setup_stdlib_logger()

    for name in args.keys():
        if name.startswith("log_"):
            args.pop(name)

    return logger


def setup_stdlib_logger():
    logging.root.handlers = []
    logging.root = stdadapter.std_logging_adapter(logging.root)


def do_test_relative_imports(test_root):
    global serve, manifest

    sys.path.insert(0, os.path.join(test_root))
    sys.path.insert(0, os.path.join(test_root, "tools", "scripts"))
    import serve, manifest


class TestEnvironmentError(Exception):
    pass


class TestEnvironment(object):
    def __init__(self, test_path, options):
        """Context manager that owns the test environment i.e. the http and
        websockets servers"""
        self.test_path = test_path
        self.server = None
        self.config = None
        self.test_server_port = options.pop("test_server_port", True)
        self.options = options if options is not None else {}
        self.files_to_restore = []

    def __enter__(self):
        self.copy_required_files()

        config = self.load_config()
        serve.set_computed_defaults(config)

        serve.logger = serve.default_logger("info")
        self.config, self.servers = serve.start(config)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.restore_files()
        for scheme, servers in self.servers.iteritems():
            for port, server in servers:
                server.kill()

    def load_config(self):
        default_config_path = os.path.join(self.test_path, "config.default.json")
        local_config_path = os.path.join(here, "config.json")

        with open(default_config_path) as f:
            default_config = json.load(f)

        with open(local_config_path) as f:
            data = f.read()
            local_config = json.loads(data % self.options)

        return serve.merge_json(default_config, local_config)

    def copy_required_files(self):
        logger.info("Placing required files in server environment.")
        for source, destination, copy_if_exists in [("testharness_runner.html", "", False),
                                                    ("testharnessreport.js", "resources/", True)]:
            source_path = os.path.join(here, source)
            dest_path = os.path.join(self.test_path, destination, os.path.split(source)[1])
            if os.path.exists(dest_path):
                if copy_if_exists:
                    self.files_to_restore.append(dest_path)
                    shutil.copy2(dest_path, dest_path + ".orig")
                else:
                    continue
            shutil.copy2(source_path, dest_path)

    def ensure_started(self):
        time.sleep(2)
        for scheme, servers in self.servers.iteritems():
            for port, server in servers:
                if not self.test_server_port:
                    s = socket.socket()
                    try:
                        s.connect((self.config["host"], port))
                    except socket.error:
                        raise EnvironmentError("%s server on port %d failed to start" % (scheme, port))
                    finally:
                        s.close()

                if not server.is_alive():
                    raise EnvironmentError("%s server on port %d failed to start" % (scheme, port))

    def restore_files(self):
        for path in self.files_to_restore:
            os.unlink(path)
            if os.path.exists(path + ".orig"):
                os.rename(path + ".orig", path)

class TestChunker(object):
    def __init__(self, total_chunks, chunk_number):
        self.total_chunks = total_chunks
        self.chunk_number = chunk_number
        assert self.chunk_number <= self.total_chunks

    def __call__(self, manifest):
        raise NotImplementedError

class Unchunked(TestChunker):
    def __init__(self, *args, **kwargs):
        TestChunker.__init__(self, *args, **kwargs)
        assert self.total_chunks == 1

    def __call__(self, manifest):
        for item in manifest:
            yield item

class HashChunker(TestChunker):
    def __call__(self):
        chunk_index = self.chunk_number - 1
        for test_path, tests in manifest:
            if hash(test_path) % self.total_chunks == chunk_index:
                yield test_path, tests

class EqualTimeChunker(TestChunker):
    """Chunker that uses the test timeout as a proxy for the running time of the test"""

    def _get_chunk(self, manifest_items):
        # For each directory containing tests, calculate the mzximum execution time after running all
        # the tests in that directory. Then work out the index into the manifest corresponding to the
        # directories at fractions of m/N of the running time where m=1..N-1 and N is the total number
        # of chunks. Return an array of these indicies

        total_time = 0
        by_dir = OrderedDict()

        class PathData(object):
            def __init__(self):
                self.time = 0
                self.tests = []

        for i, (test_path, tests) in enumerate(manifest_items):
            test_dir = tuple(os.path.split(test_path)[0].split(os.path.sep)[:3])

            if not test_dir in by_dir:
                by_dir[test_dir] = PathData()

            data = by_dir[test_dir]
            time = sum(test.timeout for test in tests)
            data.time += time
            data.tests.append((test_path, tests))

            total_time += time

        if len(by_dir) < self.total_chunks:
            raise ValueError("Tried to split into %i chunks, but only %i subdirectories included" % (self.total_chunks, len(by_dir)))

        n_chunks = self.total_chunks
        time_per_chunk = float(total_time) / n_chunks

        chunks = []

        # Put any individual dirs with a time greater than the timeout into their own
        # chunk
        while True:
            to_remove = []
            for path, data in by_dir.iteritems():
                if data.time > time_per_chunk:
                    to_remove.append((path, data))
            if to_remove:
                for path, data in to_remove:
                    chunks.append(([path], data.tests))
                    del by_dir[path]

                n_chunks -= len(to_remove)
                total_time -= sum(item[1].time for item in to_remove)
                time_per_chunk = total_time / n_chunks
            else:
                break

        chunk_time = 0
        for i, (path, data) in enumerate(by_dir.iteritems()):
            if i == 0:
                # Always start a new chunk the first time
                chunks.append(([path], data.tests))
                chunk_time = data.time
            elif chunk_time + data.time > time_per_chunk:
                if (abs(time_per_chunk - chunk_time) <=
                    abs(time_per_chunk - (chunk_time + data.time))):
                    # Add a new chunk
                    chunks.append(([path], data.tests))
                    chunk_time = data.time
                else:
                    # Add this to the end of the previous chunk but
                    # start a new chunk next time
                    chunks[-1][0].append(path)
                    chunks[-1][1].extend(data.tests)
                    chunk_time += data.time
            else:
                # Append this to the previous chunk
                chunks[-1][0].append(path)
                chunks[-1][1].extend(data.tests)
                chunk_time += data.time

        assert len(chunks) == self.total_chunks, len(chunks)
        chunks = sorted(chunks)

        return chunks[self.chunk_number - 1][1]


    def __call__(self, manifest_iter):
        manifest = list(manifest_iter)
        tests = self._get_chunk(manifest)
        for item in tests:
            yield item

class TestFilter(object):
    def __init__(self, include=None, exclude=None, manifest_path=None):
        if manifest_path is not None and include is None:
            self.manifest = manifestinclude.get_manifest(manifest_path)
        else:
            self.manifest = manifestinclude.IncludeManifest.create()

        if include is not None:
            self.manifest.set("skip", "true")
            for item in include:
                self.manifest.add_include(item)

        if exclude is not None:
            for item in exclude:
                self.manifest.add_exclude(item)

    def __call__(self, manifest_iter):
        for test_path, tests in manifest_iter:
            include_tests = set()
            for test in tests:
                if self.manifest.include(test):
                    include_tests.add(test)

            if include_tests:
                yield test_path, include_tests

class TestLoader(object):
    def __init__(self, tests_root, metadata_root, test_filter, run_info):
        self.tests_root = tests_root
        self.metadata_root = metadata_root
        self.test_filter = test_filter
        self.run_info = run_info
        self.manifest_path = os.path.join(self.metadata_root, "MANIFEST.json")
        self.manifest = self.load_manifest()
        self.tests = None

    def create_manifest(self):
        logger.info("Creating test manifest")
        manifest.setup_git(self.test_path)
        manifest_file = manifest.Manifest(None)
        manifest.update(manifest_file)
        manifest.write(manifest_file, self.manifest_path)

    def load_manifest(self):
        if not os.path.exists(self.manifest_path):
            self.create_manifest()
        return manifest.load(self.manifest_path)

    def get_test(self, manifest_test, expected_file):
        if expected_file is not None:
            expected = expected_file.get_test(manifest_test.id)
        else:
            expected = None
        return wpttest.from_manifest(manifest_test, expected)

    def load_expected_manifest(self, test_path):
        return manifestexpected.get_manifest(self.metadata_root, test_path, self.run_info)

    def iter_tests(self, test_types, chunker=None):
        manifest_items = self.test_filter(self.manifest.itertypes(*test_types))

        for test_path, tests in manifest_items:
            expected_file = self.load_expected_manifest(test_path)
            for manifest_test in tests:
                test = self.get_test(manifest_test, expected_file)
                test_type = manifest_test.item_type
                yield test_path, test_type, test

    def get_disabled(self, test_types):
        rv = defaultdict(list)

        for test_path, test_type, test in self.iter_tests(test_types):
            if test.disabled():
                rv[test_type].append(test)

        return rv

    def load_tests(self, test_types, chunk_type, total_chunks, chunk_number):
        """Read in the tests from the manifest file and add them to a queue"""
        rv = defaultdict(list)

        manifest_items = self.test_filter(self.manifest.itertypes(*test_types))

        chunker = {"none": Unchunked,
                   "hash": HashChunker,
                   "equal_time": EqualTimeChunker}[chunk_type](total_chunks,
                                                               chunk_number)

        for test_path, test_type, test in self.iter_tests(test_types, chunker):
            if not test.disabled():
                rv[test_type].append(test)

        return rv

    def get_groups(self, test_types, chunk_type="none", total_chunks=1, chunk_number=1):
        if self.tests is None:
            self.tests = self.load_tests(test_types, chunk_type, total_chunks, chunk_number)

        groups = set()

        for test_type in test_types:
            for test in self.tests[test_type]:
                group = test.url.split("/")[1]
                groups.add(group)

        return groups

    def queue_tests(self, test_types, chunk_type, total_chunks, chunk_number):
        if self.tests is None:
            self.tests = self.load_tests(test_types, chunk_type, total_chunks, chunk_number)

        tests_queue = defaultdict(Queue)
        test_ids = []

        for test_type in test_types:
            for test in self.tests[test_type]:
                tests_queue[test_type].put(test)
                test_ids.append(test.id)

        return test_ids, tests_queue

class LogThread(threading.Thread):
    def __init__(self, queue, logger, level):
        self.queue = queue
        self.log_func = getattr(logger, level)
        threading.Thread.__init__(self, name="Thread-Log")
        self.daemon = True

    def run(self):
        while True:
            try:
                msg = self.queue.get()
            except EOFError:
                break
            if msg is None:
                break
            else:
                self.log_func(msg)


class LoggingWrapper(StringIO):
    """Wrapper for file like objects to redirect output to logger
    instead"""
    def __init__(self, queue, prefix=None):
        self.queue = queue
        self.prefix = prefix

    def write(self, data):
        if isinstance(data, str):
            data = data.decode("utf8")

        if data.endswith("\n"):
            data = data[:-1]
        if data.endswith("\r"):
            data = data[:-1]
        if not data:
            return
        if self.prefix is not None:
            data = "%s: %s" % (self.prefix, data)
        self.queue.put(data)

    def flush(self):
        pass

def list_test_groups(tests_root, metadata_root, test_types, product, **kwargs):
    do_test_relative_imports(tests_root)

    run_info = wpttest.get_run_info(product, debug=False)
    test_filter = TestFilter(include=kwargs["include"], exclude=kwargs["exclude"],
                             manifest_path=kwargs["include_manifest"])
    test_loader = TestLoader(tests_root, metadata_root, test_filter, run_info)

    for item in sorted(test_loader.get_groups(test_types)):
        print item

def list_disabled(tests_root, metadata_root, test_types, product, **kwargs):
    rv = []
    run_info = wpttest.get_run_info(product, debug=False)
    test_loader = TestLoader(tests_root, metadata_root, TestFilter(), run_info)

    for test_type, tests in test_loader.get_disabled(test_types).iteritems():
        for test in tests:
            rv.append({"test": test.id, "reason": test.disabled()})
    print json.dumps(rv, indent=2)

def run_tests(tests_root, metadata_root, product, **kwargs):
    logging_queue = None
    logging_thread = None
    original_stdio = (sys.stdout, sys.stderr)
    test_queues = None

    try:
        if not kwargs["no_capture_stdio"]:
            logging_queue = Queue()
            logging_thread = LogThread(logging_queue, logger, "info")
            sys.stdout = LoggingWrapper(logging_queue, prefix="STDOUT")
            sys.stderr = LoggingWrapper(logging_queue, prefix="STDERR")
            logging_thread.start()

        do_test_relative_imports(tests_root)

        run_info = wpttest.get_run_info(product, debug=False)

        (check_args,
         browser_cls, get_browser_kwargs,
         executor_classes, get_executor_kwargs,
         env_options) = products.load_product(product)

        check_args(**kwargs)

        browser_kwargs = get_browser_kwargs(**kwargs)

        unexpected_total = 0

        if "test_loader" in kwargs:
            test_loader = kwargs["test_loader"]
        else:
            test_filter = TestFilter(include=kwargs["include"], exclude=kwargs["exclude"],
                                     manifest_path=kwargs["include_manifest"])
            test_loader = TestLoader(tests_root, metadata_root, test_filter, run_info)

        logger.info("Using %i client processes" % kwargs["processes"])

        with TestEnvironment(tests_root, env_options) as test_environment:
            try:
                test_environment.ensure_started()
            except TestEnvironmentError as e:
                logger.critical("Error starting test environment: %s" % e.message)
                raise

            base_server = "http://%s:%i" % (test_environment.config["host"],
                                            test_environment.config["ports"]["http"][0])
            repeat = kwargs["repeat"]
            for repeat_count in xrange(repeat):
                if repeat > 1:
                    logger.info("Repetition %i / %i" % (repeat_count + 1, repeat))

                test_ids, test_queues = test_loader.queue_tests(kwargs["test_types"],
                                                                kwargs["chunk_type"],
                                                                kwargs["total_chunks"],
                                                                kwargs["this_chunk"])
                unexpected_count = 0
                logger.suite_start(test_ids, run_info)
                for test_type in kwargs["test_types"]:
                    logger.info("Running %s tests" % test_type)
                    tests_queue = test_queues[test_type]

                    executor_cls = executor_classes.get(test_type)
                    executor_kwargs = get_executor_kwargs(base_server,
                                                          **kwargs)

                    if executor_cls is None:
                        logger.error("Unsupported test type %s for product %s" % (test_type, product))
                        continue

                    with ManagerGroup("web-platform-tests",
                                      kwargs["processes"],
                                      browser_cls,
                                      browser_kwargs,
                                      executor_cls,
                                      executor_kwargs) as manager_group:
                        try:
                            manager_group.start(tests_queue)
                        except KeyboardInterrupt:
                            logger.critical("Main thread got signal")
                            manager_group.stop()
                            raise
                        manager_group.wait()
                    unexpected_count += manager_group.unexpected_count()

                unexpected_total += unexpected_count
                logger.info("Got %i unexpected results" % unexpected_count)
                logger.suite_end()
    except KeyboardInterrupt:
        if test_queues is not None:
            for queue in test_queues.itervalues():
                queue.cancel_join_thread()
    finally:
        if test_queues is not None:
            for queue in test_queues.itervalues():
                queue.close()
        sys.stdout, sys.stderr = original_stdio
        if not kwargs["no_capture_stdio"] and logging_queue is not None:
            logger.info("Closing logging queue")
            logging_queue.put(None)
            if logging_thread is not None:
                logging_thread.join(10)
            logging_queue.close()

    return manager_group.unexpected_count() == 0


def setup_compat_args(kwargs):
    if not "log_raw" in kwargs or kwargs["log_raw"] is None:
        kwargs["log_raw"] = []

    if "output_file" in kwargs:
        path = kwargs.pop("output_file")
        if path is not None:
            output_dir = os.path.split(path)[0]
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            kwargs["log_raw"].append(open(path, "w"))

    if "log_stdout" in kwargs:
        if kwargs.pop("log_stdout"):
            kwargs["log_raw"].append(sys.stdout)

def main():
    """Main entry point when calling from the command line"""
    args = wptcommandline.parse_args()
    kwargs = vars(args)

    if kwargs["prefs_root"] is None:
        kwargs["prefs_root"] = os.path.abspath(os.path.join(here, "prefs"))

    setup_logging(kwargs, {"raw": sys.stdout})

    if args.list_test_groups:
        list_test_groups(**kwargs)
    elif args.list_disabled:
        list_disabled(**kwargs)
    else:
        return run_tests(**kwargs)
