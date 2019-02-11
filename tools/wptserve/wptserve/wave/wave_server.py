import sys
import os
from . import configuration_loader

from .network.http_handler import HttpHandler
from .network.api.sessions_api_handler import SessionsApiHandler
from .network.api.tests_api_handler import TestsApiHandler
from .network.api.results_api_handler import ResultsApiHandler
from .network.static_handler import StaticHandler

from .testing.sessions_manager import SessionsManager
from .testing.results_manager import ResultsManager
from .testing.tests_manager import TestsManager
from .testing.test_loader import TestLoader
from .testing.event_dispatcher import EventDispatcher


class WaveServer(object):
    def initialize(self, configuration_file_path=u".", application_directory_path=u"", reports_enabled=False):
        sys.stdout.write(u"Loading configuration ...")
        sys.stdout.flush()

        configuration = configuration_loader.load(configuration_file_path)

        print u" done."

        # Initialize Managers
        event_dispatcher = EventDispatcher()
        sessions_manager = SessionsManager()
        results_manager = ResultsManager()
        tests_manager = TestsManager()
        test_loader = TestLoader()

        sessions_manager.initialize(
            test_loader=test_loader,
            event_dispatcher=event_dispatcher,
            tests_manager=tests_manager,
            results_directory=configuration[u"results_directory_path"],
            results_manager=results_manager
        )

        results_manager.initialize(
            results_directory_path=configuration[u"results_directory_path"],
            sessions_manager=sessions_manager,
            tests_manager=tests_manager,
            import_enabled=configuration["import_enabled"],
            reports_enabled=reports_enabled,
            persisting_interval=configuration["persisting_interval"]
        )

        tests_manager.initialize(
            test_loader, 
            results_manager=results_manager, 
            sessions_manager=sessions_manager,
            event_dispatcher=event_dispatcher
        )

        # Load Tests
        exclude_list_file_path = os.path.abspath(u"./excluded.json")
        include_list_file_path = os.path.abspath(u"./included.json")
        manifest_file_path = os.path.abspath(u"./MANIFEST.json")
        test_loader.initialize(
            exclude_list_file_path,
            include_list_file_path,
            results_manager=results_manager,
            api_titles=configuration[u"api_titles"]
        )

        test_loader.load_tests(manifest_file_path)

        # Initialize HTTP handlers
        static_handler = StaticHandler(
                web_root=configuration["web_root"],
                http_port=configuration["wpt_port"],
                https_port=configuration["wpt_ssl_port"]
        )
        sessions_api_handler = SessionsApiHandler(
            sessions_manager=sessions_manager, 
            results_manager=results_manager,
            event_dispatcher=event_dispatcher
        )
        tests_api_handler = TestsApiHandler(
            tests_manager=tests_manager, 
            sessions_manager=sessions_manager,
            wpt_port=configuration[u"wpt_port"],
            wpt_ssl_port=configuration[u"wpt_ssl_port"],
            hostname=configuration[u"hostname"],
            web_root=configuration["web_root"],
            test_loader=test_loader
        )
        results_api_handler = ResultsApiHandler(results_manager)

        # Initialize HTTP server
        http_handler = HttpHandler(
            static_handler=static_handler,
            sessions_api_handler=sessions_api_handler,
            tests_api_handler=tests_api_handler,
            results_api_handler=results_api_handler,
            http_port=configuration[u"wpt_port"]
        )
        self.handle_request = http_handler.handle_request
