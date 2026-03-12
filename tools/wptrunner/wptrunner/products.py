from __future__ import annotations

import importlib
from dataclasses import dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    Protocol,
    TypedDict,
)

from .browsers import product_list

if TYPE_CHECKING:
    import sys
    from types import ModuleType

    from mozlog.structuredlog import StructuredLogger
    from wptserve.config import Config

    from .browsers import base as browsers_base
    from .environment import TestEnvironment
    from .executors.base import TestExecutor
    from .testloader import Subsuite

    if sys.version_info >= (3, 9):
        from collections.abc import Mapping, Sequence
    else:
        from typing import Mapping, Sequence

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


@dataclass
class Product:
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
    run_info_extras: RunInfoExtras
    update_properties: tuple[Sequence[str], Mapping[str, Sequence[str]]]

    def __init__(
        self,
        name: str,
        *,
        browser_classes: Mapping[str | None, type[browsers_base.Browser]],
        check_args: CheckArgs,
        get_browser_kwargs: BrowserKwargs,
        get_executor_kwargs: ExecutorKwargs,
        env_options: Mapping[str, Any],
        get_env_extras: EnvExtras,
        get_timeout_multiplier: TimeoutMultiplier,
        executor_classes: Mapping[str, type[TestExecutor]],
        run_info_extras: None | RunInfoExtras = None,
        update_properties: None | tuple[Sequence[str], Mapping[str, Sequence[str]]] = None,
    ) -> None:
        self.name = name
        self._browser_cls = browser_classes
        self.check_args = check_args
        self.get_browser_kwargs = get_browser_kwargs
        self.get_executor_kwargs = get_executor_kwargs
        self.env_options = env_options
        self.get_env_extras = get_env_extras
        self.get_timeout_multiplier = get_timeout_multiplier
        self.executor_classes = executor_classes

        if run_info_extras is not None:
            self.run_info_extras = run_info_extras
        else:
            self.run_info_extras = default_run_info_extras

        if update_properties is not None:
            self.update_properties = update_properties
        else:
            self.update_properties = (["product"], {})

    def get_browser_cls(self, test_type: str) -> type[browsers_base.Browser]:
        if test_type in self._browser_cls:
            return self._browser_cls[test_type]
        return self._browser_cls[None]

    @staticmethod
    def _from_dunder_wptrunner(module: ModuleType) -> Product:
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
        module = _product_module(name)
        product = Product._from_dunder_wptrunner(module)
        if name != product.name:
            msg = f"Product {name!r} calls itself {product.name!r}, which differs"
            raise ValueError(msg)
        return product
