from __future__ import annotations

import importlib
import warnings
from dataclasses import dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    Protocol,
    TypedDict,
    overload,
)

from ._default_if_sentinel import DefaultIfSentinel
from .browsers import product_list
from .deprecated import deprecated

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

    if sys.version_info >= (3, 11):
        from typing import Self
    else:
        from typing_extensions import Self


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
class _ProductBase:
    name: str
    # Once we can rely on Python 3.10, we should add:
    # _: KW_ONLY
    # This matches the non-deprecated __init__ below.
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


_legacy_product_msg = "Use Product.from_product_name(name) instead of Product(config, name)"


class Product(_ProductBase):
    @overload
    @deprecated(_legacy_product_msg, category=None)
    def __new__(
        cls,
        config: object,
        legacy_name: str,
        /,
    ) -> Product:
        ...

    @overload
    def __new__(
        cls,
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
    ) -> Self:
        ...

    def __new__(cls, *args: Any, **kwargs: Any) -> Self | Product:
        if len(args) == 2:
            if not isinstance(args[1], str):
                raise TypeError(f"(Deprecated) Product(config, legacy_name) second arg must be a str, not {type(args[1])}")
            if kwargs:
                raise TypeError(f"(Deprecated) Product(config, legacy_name) got an unexpected keyword argument {next(iter(kwargs))!r}")
            warnings.warn(
                _legacy_product_msg,
                DeprecationWarning,
                stacklevel=2,
            )
            return cls.from_product_name(args[1])
        return super().__new__(cls)

    @overload
    @deprecated(_legacy_product_msg, category=None)
    def __init__(
        self,
        config: object,
        legacy_name: str,
        /,
    ) -> None:
        ...

    @overload
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
        ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        if len(args) == 2:
            if not hasattr(self, "name"):
                raise Exception("(Deprecated) Product(config, legacy_name) should be initialized in __new__.")
            return
        super().__init__(*args, **kwargs)

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
