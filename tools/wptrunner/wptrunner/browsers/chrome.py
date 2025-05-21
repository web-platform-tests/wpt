import re
import time
from typing import Any, List, Optional, Sequence, Tuple, Type

from mozlog.structuredlog import StructuredLogger
from wptserve.config import Config

from . import chrome_spki_certs
from .base import (
    BrowserError,
    BrowserKwargs,
    BrowserSettings,
    ExecutorBrowser,
    ExecutorBrowserKwargs,
    ExecutorKwargs,
    OutputHandler,
    UpdateProperties,
    WebDriverBrowser,
    cmd_arg,
    get_free_port,
    require_arg,
)
from .base import get_timeout_multiplier   # noqa: F401
from ..environment import EnvironmentExtra, EnvironmentOptions, TestEnvironment
from ..executors import executor_kwargs as base_executor_kwargs
from ..executors.base import WdspecExecutor  # noqa: F401
from ..executors.executorchrome import (  # noqa: F401
    ChromeDriverPrintRefTestExecutor,
    ChromeDriverRefTestExecutor,
    ChromeDriverTestharnessExecutor,
    ChromeDriverCrashTestExecutor
)
from ..testloader import GroupMetadata, Subsuite
from ..wpttest import TestType, RunInfo


__wptrunner__ = {"product": "chrome",
                 "check_args": "check_args",
                 "browser": "ChromeBrowser",
                 "executor": {"testharness": "ChromeDriverTestharnessExecutor",
                              "reftest": "ChromeDriverRefTestExecutor",
                              "print-reftest": "ChromeDriverPrintRefTestExecutor",
                              "wdspec": "WdspecExecutor",
                              "crashtest": "ChromeDriverCrashTestExecutor"},
                 "browser_kwargs": "browser_kwargs",
                 "executor_kwargs": "executor_kwargs",
                 "env_extras": "env_extras",
                 "env_options": "env_options",
                 "update_properties": "update_properties",
                 "timeout_multiplier": "get_timeout_multiplier",}

from ..wpttest import Test


def check_args(**kwargs: Any) -> None:
    require_arg(kwargs, "webdriver_binary")


def browser_kwargs(logger: StructuredLogger, test_type: TestType, run_info_data: RunInfo,
                   config: Config, **kwargs: Any) -> BrowserKwargs:
    return {"binary": kwargs["binary"],
            "webdriver_binary": kwargs["webdriver_binary"],
            "webdriver_args": kwargs.get("webdriver_args"),
            "leak_check": kwargs.get("leak_check", False)}


def executor_kwargs(logger: StructuredLogger, test_type: TestType,
                    test_environment: TestEnvironment, run_info_data: RunInfo, subsuite: Subsuite,
                    **kwargs: Any) -> ExecutorKwargs:
    executor_kwargs = dict(base_executor_kwargs(test_type, test_environment, run_info_data,
                                                subsuite, **kwargs))
    executor_kwargs["close_after_done"] = True
    executor_kwargs["sanitizer_enabled"] = kwargs.get("sanitizer_enabled", False)
    executor_kwargs["reuse_window"] = kwargs.get("reuse_window", False)

    capabilities = {
        "goog:chromeOptions": {
            "prefs": {
                "profile": {
                    "default_content_setting_values": {
                        "popups": 1
                    }
                }
            },
            "excludeSwitches": ["enable-automation"],
            "w3c": True,
        }
    }

    chrome_options = capabilities["goog:chromeOptions"]
    if kwargs["binary"] is not None:
        chrome_options["binary"] = kwargs["binary"]
    if kwargs["debug_test"]:
        # Give debuggers like `rr` time to terminate gracefully and dump
        # recordings or traces. Note that older `chromedriver` versions will
        # fail to create a session if they don't recognize this capability.
        chrome_options["quitGracefully"] = True

    # Here we set a few Chrome flags that are always passed.
    # ChromeDriver's "acceptInsecureCerts" capability only controls the current
    # browsing context, whereas the CLI flag works for workers, too.
    args = []

    args.append("--ignore-certificate-errors-spki-list=%s" %
                ','.join(chrome_spki_certs.IGNORE_CERTIFICATE_ERRORS_SPKI_LIST))

    # Allow audio autoplay without a user gesture.
    args.append("--autoplay-policy=no-user-gesture-required")
    # Allow WebRTC tests to call getUserMedia and getDisplayMedia.
    args.append("--use-fake-device-for-media-stream")
    args.append("--use-fake-ui-for-media-stream")
    # Use a fake UI for FedCM to allow testing it.
    args.append("--use-fake-ui-for-fedcm")
    # This is needed until https://github.com/web-platform-tests/wpt/pull/40709
    # is merged.
    args.append("--enable-features=FedCmWithoutWellKnownEnforcement")
    # Use a fake UI for digital identity to allow testing it.
    args.append("--use-fake-ui-for-digital-identity")
    # Shorten delay for Reporting <https://w3c.github.io/reporting/>.
    args.append("--short-reporting-delay")
    # Point all .test domains to localhost for Chrome
    args.append("--host-resolver-rules=MAP nonexistent.*.test ^NOTFOUND, MAP *.test 127.0.0.1, MAP *.test. 127.0.0.1")
    # Enable Secure Payment Confirmation for Chrome. This is normally disabled
    # on Linux as it hasn't shipped there yet, but in WPT we enable virtual
    # authenticator devices anyway for testing and so SPC works.
    args.append("--enable-features=SecurePaymentConfirmationBrowser")
    # For WebTransport tests.
    args.append("--webtransport-developer-mode")
    # The GenericSensorExtraClasses flag enables the browser-side
    # implementation of sensors such as Ambient Light Sensor.
    args.append("--enable-features=GenericSensorExtraClasses")
    # Do not show Chrome for Testing infobar. For other Chromium build this
    # flag is no-op. Required to avoid flakiness in tests, as the infobar
    # changes the viewport, which can happen during the test run.
    args.append("--disable-infobars")
    # For WebNN tests.
    args.append("--enable-features=WebMachineLearningNeuralNetwork")
    # For Web Speech API tests.
    args.append("--enable-features=" + ",".join([
        "InstallOnDeviceSpeechRecognition",
        "OnDeviceWebSpeechAvailable",
        "OnDeviceWebSpeech",
        "MediaStreamTrackWebSpeech",
        "WebSpeechRecognitionContext",
    ]))
    # For testing WebExtensions using WebDriver.
    args.append("--enable-unsafe-extension-debugging")
    # Connection between ChromeDriver and Chrome will be over pipes.
    # This is needed to test extensions, PWA, compilation caches that
    # require local CDP access.
    args.append("--remote-debugging-pipe")

    # Classify `http-private`, `http-public` and https variants in the
    # appropriate IP address spaces.
    # For more details, see: https://github.com/web-platform-tests/rfcs/blob/master/rfcs/address_space_overrides.md
    address_space_overrides_ports = [
        ("http-private", "private"),
        ("http-public", "public"),
        ("https-private", "private"),
        ("https-public", "public"),
    ]
    address_space_overrides_arg = ",".join(
        f"127.0.0.1:{port_number}={address_space}"
        for port_name, address_space in address_space_overrides_ports
        for port_number in test_environment.config.ports.get(port_name, [])
    )
    if address_space_overrides_arg:
        args.append(f"--ip-address-space-overrides={address_space_overrides_arg}")

    # Disable overlay scrollbar animations to prevent flaky wpt screenshots based on timing.
    args.append("--disable-features=ScrollbarAnimations")

    # Always enable ViewTransitions long callback timeout to avoid erroneous
    # failures due to implicit timeout within the API.
    blink_features = ['ViewTransitionLongCallbackTimeoutForTesting']

    if kwargs["enable_mojojs"]:
        blink_features.extend(['MojoJS', 'MojoJSTest'])

    args.append("--enable-blink-features=" + ','.join(blink_features))

    if kwargs["enable_swiftshader"]:
        # https://chromium.googlesource.com/chromium/src/+/HEAD/docs/gpu/swiftshader.md
        args.extend(["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])

    if kwargs["enable_experimental"]:
        args.extend(["--enable-experimental-web-platform-features"])

    # Copy over any other flags that were passed in via `--binary-arg` or the
    # subsuite config.
    binary_args = kwargs.get("binary_args", []) + subsuite.config.get("binary_args", [])
    for arg in binary_args:
        if arg not in args:
            args.append(arg)

    # Pass the --headless=new flag to Chrome if WPT's own --headless flag was
    # set. '--headless' should always mean the new headless mode, as the old
    # headless mode is not used anyway.
    if kwargs["headless"] and ("--headless=new" not in args and
                               "--headless=old" not in args and
                               "--headless" not in args):
        args.append("--headless=new")

    chrome_options["args"] = args
    if test_type == "wdspec":
        executor_kwargs["binary_args"] = chrome_options["args"]

    executor_kwargs["capabilities"] = capabilities

    return executor_kwargs


def env_extras(**kwargs: Any) -> Sequence[EnvironmentExtra]:
    return []


def env_options() -> EnvironmentOptions:
    return {"server_host": "127.0.0.1"}


def update_properties() -> UpdateProperties:
    return (["debug", "os", "processor"], {"os": ["version"], "processor": ["bits"]})


class ChromeBrowser(WebDriverBrowser):

    # Chrome browser's default startup timeout is 60 seconds. Use 65 seconds here
    # to allow error message be displayed if that happens.
    init_timeout: float = 65

    def __init__(self,
                 logger: StructuredLogger,
                 leak_check: bool = False,
                 **kwargs: Any):
        super().__init__(logger, **kwargs)
        self._output_handler: Optional[ChromeDriverOutputHandler]
        self._leak_check = leak_check
        self._actual_port: Optional[int] = None
        self._require_webdriver_bidi: Optional[bool] = None

    def restart_on_test_type_change(self, new_test_type: str, old_test_type: str) -> bool:
        # Restart the test runner when switch from/to wdspec tests. Wdspec test
        # is using a different protocol class so a restart is always needed.
        if "wdspec" in [old_test_type, new_test_type]:
            return True
        return False

    def create_output_handler(self, cmd: List[str]) -> OutputHandler:
        return ChromeDriverOutputHandler(
            self.logger,
            cmd,
            init_deadline=self.init_deadline)

    def make_command(self) -> List[str]:
        # TODO(crbug.com/354135326): Don't pass port unless specified explicitly
        # after M132.
        port = get_free_port() if self._port is None else self._port
        return [self.webdriver_binary,
                cmd_arg("port", str(port)),
                # TODO(crbug.com/354135326): Remove --ignore-explicit-port after
                # M132.
                cmd_arg("ignore-explicit-port", None),
                cmd_arg("url-base", self.base_path),
                cmd_arg("enable-chrome-logs")] + self.webdriver_args

    @property
    def port(self) -> int:
        # We read the port from WebDriver on startup
        if self._actual_port is None:
            if self._output_handler is None or self._output_handler.port is None:
                raise ValueError("Can't get WebDriver port from its stdout")
            self._actual_port = self._output_handler.port
        return self._actual_port

    def start(self, group_metadata: GroupMetadata, **kwargs: Any) -> None:
        if self._actual_port is not None:
            raise BrowserError('Unable to start a new WebDriver instance while the old instance is still running')
        super().start(group_metadata=group_metadata, **kwargs)

    def stop(self, force: bool = False, **kwargs: Any) -> bool:
        self._actual_port = None
        return super().stop(force=force, **kwargs)

    def executor_browser(self) -> Tuple[Type[ExecutorBrowser], ExecutorBrowserKwargs]:
        browser_cls, browser_kwargs = super().executor_browser()
        return browser_cls, {**browser_kwargs, "leak_check": self._leak_check}

    @property
    def require_webdriver_bidi(self) -> Optional[bool]:
        return self._require_webdriver_bidi

    def settings(self, test: Test) -> BrowserSettings:
        """ Required to store `require_webdriver_bidi` in browser settings."""
        settings = super().settings(test)
        self._require_webdriver_bidi = test.testdriver_features is not None and 'bidi' in test.testdriver_features

        return {
            **settings,
            "require_webdriver_bidi": self._require_webdriver_bidi
        }


class ChromeDriverOutputHandler(OutputHandler):
    PORT_RE = re.compile(rb'.*was started successfully on port (\d+)\.')
    NO_PORT_RE = re.compile(rb'.*was started successfully\.')
    REQUESTED_PORT_RE = re.compile(r'.*-port=(\d+)')

    def __init__(self,
                 logger: StructuredLogger,
                 command: List[str],
                 init_deadline: Optional[float] = None):
        super().__init__(logger, command)
        self.port: Optional[int] = None
        # TODO(crbug.com/354135326): Remove requested_port logic below after M132.
        self._requested_port = None
        for arg in command:
            m = self.REQUESTED_PORT_RE.match(arg)
            if m is not None:
                self._requested_port = int(m.groups()[0])
        self.init_deadline = init_deadline

    def after_process_start(self, pid: int) -> None:
        super().after_process_start(pid)
        while self.port is None:
            time.sleep(0.1)
            if self.init_deadline is not None and time.time() > self.init_deadline:
                raise TimeoutError("Failed to get WebDriver port within the timeout")

    def __call__(self, line: bytes) -> None:
        if self.port is None:
            m = self.PORT_RE.match(line)
            if m is not None:
                self.port = int(m.groups()[0])
                self.logger.info(f"Got WebDriver port {self.port}")
            else:
                # TODO(crbug.com/354135326): Remove requested_port logic below after M132.
                m = self.NO_PORT_RE.match(line)
                if m is not None:
                    self.port = self._requested_port
                    self.logger.info(f"Got WebDriver port {self.port}")
        super().__call__(line)
