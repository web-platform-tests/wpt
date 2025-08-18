from typing import Any, Dict, List, Literal, Mapping, Optional

from ._module import BidiModule, command
from ..undefined import UNDEFINED, Maybe


class CoordinatesOptions(Dict[str, Any]):
    def __init__(
            self,
            latitude: float,
            longitude: float,
            accuracy: Maybe[float] = UNDEFINED,
            altitude: Maybe[Optional[float]] = UNDEFINED,
            altitude_accuracy: Maybe[Optional[float]] = UNDEFINED,
            heading: Maybe[Optional[float]] = UNDEFINED,
            speed: Maybe[Optional[float]] = UNDEFINED,
    ):
        self["latitude"] = latitude
        self["longitude"] = longitude
        self["accuracy"] = accuracy
        self["altitude"] = altitude
        self["altitudeAccuracy"] = altitude_accuracy
        self["heading"] = heading
        self["speed"] = speed


class Emulation(BidiModule):
    @command
    def set_geolocation_override(
            self,
            coordinates: Maybe[Optional[CoordinatesOptions]] = UNDEFINED,
            error: Maybe[Dict[str, Any]] = UNDEFINED,
            contexts: Maybe[List[str]] = UNDEFINED,
            user_contexts: Maybe[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "coordinates": coordinates,
            "error": error,
            "contexts": contexts,
            "userContexts": user_contexts
        }

    @command
    def set_locale_override(
            self,
            locale: Optional[str],
            contexts: Maybe[List[str]] = UNDEFINED,
            user_contexts: Maybe[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "locale": locale,
            "contexts": contexts,
            "userContexts": user_contexts
        }

    @command
    def set_scripting_enabled(
            self,
            enabled: Literal[False, None],
            contexts: Maybe[List[str]] = UNDEFINED,
            user_contexts: Maybe[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "enabled": enabled,
            "contexts": contexts,
            "userContexts": user_contexts,
        }

    @command
    def set_screen_orientation_override(
            self,
            screen_orientation: Optional[Dict[str, Any]],
            contexts: Maybe[List[str]] = UNDEFINED,
            user_contexts: Maybe[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "screenOrientation": screen_orientation,
            "contexts": contexts,
            "userContexts": user_contexts
        }

    @command
    def set_timezone_override(
            self,
            timezone: Optional[str],
            contexts: Maybe[List[str]] = UNDEFINED,
            user_contexts: Maybe[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "timezone": timezone,
            "contexts": contexts,
            "userContexts": user_contexts
        }

    @command
    def set_user_agent_override(
            self,
            user_agent: Union[str, None],
            contexts: Union[List[str], Undefined] = UNDEFINED,
            user_contexts: Union[List[str], Undefined] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "userAgent": user_agent,
            "contexts": contexts,
            "userContexts": user_contexts,
        }
