from __future__ import annotations

import importlib
from dataclasses import dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    Protocol,
    TypedDict,
)

from ._default_if_sentinel import DefaultIfSentinel
from .browsers import product_list

if TYPE_CHECKING:
    import sys
    from collections.abc import Mapping, Sequence
    from types import ModuleType

    from mozlog.structuredlog import StructuredLogger
    from wptserve.config import Config

    from .browsers import base as browsers_base
    from .environment import TestEnvironment
    from .executors.base import TestExecutor
    from .testloader import Subsuite

    if sys.version_info >= (3, 10):
        from typing import TypeAlias
    else:
        from typing_extensions import TypeAlias


JSON: TypeAlias = "Mapping[str, 'JSON'] | Sequence['JSON'] | str | int | float | bool | None"


class CheckArgs(Protocol):
    def __call__(self, **kwargs: Any) -> None:
        ...


class EnvExtras(Protocol):
    def __call__(self, **kwargs: Any) -> Sequence[object]:
        ...


class BrowserKwargs(Protocol):
    def __call__(
        self,
        logger: StructuredLogger,
        test_type: str,
        run_info_data: Mapping[str, JSON],
        *,
        config: Config,
        subsuite: Subsuite,
        **kwargs: Any,
    ) -> Mapping[str, object]:
        ...


class ExecutorKwargs(Protocol):
    def __call__(
        self,
        logger: StructuredLogger,
        test_type: str,
        test_environment: TestEnvironment,
        run_info_data: Mapping[str, JSON],
        *,
        subsuite: Subsuite,
        **kwargs: Any,
    ) -> Mapping[str, object]:
        ...


class RunInfoExtras(Protocol):
    def __call__(
        self, logger: StructuredLogger, **kwargs: Any
    ) -> Mapping[str, JSON]:
        ...


class TimeoutMultiplier(Protocol):
    def __call__(
        self, test_type: str, run_info_data: Mapping[str, JSON], **kwargs: Any
    ) -> float:
        ...


class _WptrunnerModuleDictOptional(TypedDict, total=False):
    run_info_extras: str
    update_properties: str


class WptrunnerModuleDict(_WptrunnerModuleDictOptional):
    product: str
    browser: str | Mapping[str | None, str]
    check_args: str
    browser_kwargs: str
    executor_kwargs: str
    env_options: str
    env_extras: str
    timeout_multiplier: str
    executor: Mapping[str, str]


def _product_module(product: str) -> ModuleType:
    if product not in product_list:
        raise ValueError(f"Unknown product {product!r}")

    module = importlib.import_module("wptrunner.browsers." + product)
    if not hasattr(module, "__wptrunner__"):
        raise ValueError("Product module does not define __wptrunner__ variable")

    return module


def default_run_info_extras(logger: StructuredLogger, **kwargs: Any) -> Mapping[str, JSON]:
    return {}


@dataclass(frozen=True)
class Product:
    """Defines a browser product for wptrunner testing.

    Product instances specify how to launch a browser, execute tests, and
    collect results. They are used by both the wptrunner test harness and the
    ./wpt run CLI command.

    External packages can register custom products via entry points
    in the 'wptrunner.products' group. See the wptrunner plugin documentation
    for details on creating custom products.

    Attributes:
        name: Product identifier (e.g., "chrome", "firefox", "safari"). Must
            match the entry point name when registered as a plugin.
        browser_classes: Mapping from test type to Browser class. Use None
            as the key for the default browser class used by most test types.
            Can specify per-test-type browsers (e.g., {None: DefaultBrowser,
            "wdspec": WdSpecBrowser}) for products that need different browser
            behavior for different test types.
        check_args: Function to validate command-line arguments specific to
            this product. Called before test execution to ensure required
            arguments are present and valid.
        get_browser_kwargs: Function that returns kwargs for Browser
            instantiation. Takes logger, test_type, run_info_data, config,
            subsuite, and additional kwargs. Returns a dictionary of arguments
            passed to the Browser class constructor.
        get_executor_kwargs: Function that returns kwargs for Executor
            instantiation. Takes logger, test_type, test_environment,
            run_info_data, subsuite, and additional kwargs. Returns a
            dictionary of arguments passed to the TestExecutor class
            constructor.
        env_options: Environment configuration dictionary. Must include 'host'
            (hostname for test server) and 'bind_address' (whether to bind
            to specific address). May include 'supports_debugger' and other
            environment-specific options.
        get_env_extras: Function that returns additional environment setup.
            Takes kwargs and returns a sequence of objects used during test
            environment initialization.
        get_timeout_multiplier: Function that returns a timeout multiplier for
            tests. Takes test_type, run_info_data, and kwargs. Returns a float
            multiplier applied to test timeouts (e.g., 2.0 for slower browsers,
            0.5 for faster ones).
        executor_classes: Mapping from test type to Executor class. Must
            include entries for each test type the product supports (e.g.,
            {"testharness": WebDriverTestharnessExecutor, "reftest":
            WebDriverRefTestExecutor}).
        run_info_extras: Optional function that returns extra information to
            include in run_info.json. Takes logger and kwargs, returns a
            dictionary of additional metadata (e.g., browser version, build
            number). Defaults to returning an empty dictionary if not provided.
        update_properties: Optional tuple of (unconditional_properties,
            conditional_properties) specifying which properties should trigger
            manifest updates. Unconditional properties are always updated,
            conditional properties depend on test conditions. Defaults to
            (["product"], {}) if not provided.

    """
    name: str
    # Once we can rely on Python 3.10, we should add:
    # _: KW_ONLY
    # This matches __init__ below.
    browser_classes: Mapping[str | None, type[browsers_base.Browser]]
    check_args: CheckArgs
    get_browser_kwargs: BrowserKwargs
    get_executor_kwargs: ExecutorKwargs
    env_options: Mapping[str, Any]
    get_env_extras: EnvExtras
    get_timeout_multiplier: TimeoutMultiplier
    executor_classes: Mapping[str, type[TestExecutor]]
    run_info_extras: DefaultIfSentinel[
        RunInfoExtras,
    ] = DefaultIfSentinel(default=default_run_info_extras)
    update_properties: DefaultIfSentinel[
        tuple[
            Sequence[str],
            Mapping[str, Sequence[str]],
        ],
    ] = DefaultIfSentinel(default_factory=lambda: (["product"], {}))

    def get_browser_cls(self, test_type: str) -> type[browsers_base.Browser]:
        cls = self.browser_classes.get(test_type)
        if cls is not None:
            return cls
        return self.browser_classes[None]

    @staticmethod
    def _from_dunder_wptrunner(module: ModuleType) -> Product:
        """Create a Product instance from a module's __wptrunner__ dict.

        Args:
            module: Module containing __wptrunner__ dict with product configuration

        Returns:
            Product instance with all fields populated from the __wptrunner__ dict

        Raises:
            ValueError: If __wptrunner__ is missing or invalid

        """
        data: WptrunnerModuleDict = module.__wptrunner__

        name = data["product"]
        browser_classes: Mapping[str | None, type[browsers_base.Browser]] = (
            {None: getattr(module, data["browser"])}
            if isinstance(data["browser"], str)
            else {
                key: getattr(module, value)
                for key, value in data["browser"].items()
            }
        )
        check_args = getattr(module, data["check_args"])
        get_browser_kwargs = getattr(module, data["browser_kwargs"])
        get_executor_kwargs = getattr(module, data["executor_kwargs"])
        env_options = getattr(module, data["env_options"])()
        get_env_extras = getattr(module, data["env_extras"])
        get_timeout_multiplier = getattr(module, data["timeout_multiplier"])
        executor_classes = {
            test_type: getattr(module, cls_name)
            for test_type, cls_name in data["executor"].items()
        }
        run_info_extras = (
            getattr(module, data["run_info_extras"])
            if "run_info_extras" in data
            else None
        )
        update_properties = (
            getattr(module, data["update_properties"])()
            if "update_properties" in data
            else None
        )

        return Product(
            name=name,
            browser_classes=browser_classes,
            check_args=check_args,
            get_browser_kwargs=get_browser_kwargs,
            get_executor_kwargs=get_executor_kwargs,
            env_options=env_options,
            get_env_extras=get_env_extras,
            get_timeout_multiplier=get_timeout_multiplier,
            executor_classes=executor_classes,
            run_info_extras=run_info_extras,
            update_properties=update_properties,
        )

    @staticmethod
    def from_product_name(name: str) -> Product:
        """Load a Product by name.

        Args:
            name: Product name (e.g., "chrome", "firefox", "mybrowser")

        Returns:
            Product instance

        Raises:
            ValueError: If product name is unknown or entry point invalid

        """
        module = _product_module(name)
        product = Product._from_dunder_wptrunner(module)
        if name != product.name:
            msg = f"Product {name!r} calls itself {product.name!r}, which differs"
            raise ValueError(msg)
        return product
