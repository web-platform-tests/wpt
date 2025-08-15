from typing import Any, Dict, List, Literal, Mapping, MutableMapping, Optional

from ._module import BidiModule, command
from ..undefined import UNDEFINED, Undefinable


class CoordinatesOptions(Dict[str, Any]):
    def __init__(
        self,
        latitude: float,
        longitude: float,
        accuracy: Undefinable[float] = UNDEFINED,
        altitude: Undefinable[float] = UNDEFINED,
        altitude_accuracy: Undefinable[float] = UNDEFINED,
        heading: Undefinable[float] = UNDEFINED,
        speed: Undefinable[float] = UNDEFINED,
    ):
        self["latitude"] = latitude
        self["longitude"] = longitude

        if accuracy is not UNDEFINED:
            self["accuracy"] = accuracy
        if altitude is not UNDEFINED:
            self["altitude"] = altitude
        if altitude_accuracy is not UNDEFINED:
            self["altitudeAccuracy"] = altitude_accuracy
        if heading is not UNDEFINED:
            self["heading"] = heading
        if speed is not UNDEFINED:
            self["speed"] = speed


class Emulation(BidiModule):
    @command
    def set_geolocation_override(
        self,
        coordinates: Undefinable[CoordinatesOptions] = UNDEFINED,
        error: Undefinable[Dict[str, Any]] = UNDEFINED,
        contexts: Undefinable[List[str]] = UNDEFINED,
        user_contexts: Undefinable[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {}

        if coordinates is not UNDEFINED:
            params["coordinates"] = coordinates
        if error is not UNDEFINED:
            params["error"] = error
        if contexts is not UNDEFINED:
            params["contexts"] = contexts
        if user_contexts is not UNDEFINED:
            params["userContexts"] = user_contexts

        return params

    @command
    def set_locale_override(
        self,
        locale: Optional[str],
        contexts: Undefinable[List[str]] = UNDEFINED,
        user_contexts: Undefinable[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {
            "locale": locale
        }

        if contexts is not UNDEFINED:
            params["contexts"] = contexts
        if user_contexts is not UNDEFINED:
            params["userContexts"] = user_contexts

        return params

    @command
    def set_scripting_enabled(
            self,
            enabled: Literal[False, None],
            contexts: Undefinable[List[str]] = UNDEFINED,
            user_contexts: Undefinable[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "enabled": enabled,
            "contexts": contexts,
            "userContexts": user_contexts,
        }

    @command
    def set_screen_orientation_override(
        self,
        screen_orientation:Dict[str, Any],
        contexts: Undefinable[List[str]] = UNDEFINED,
        user_contexts: Undefinable[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {
            "screenOrientation": screen_orientation
        }

        if contexts is not UNDEFINED:
            params["contexts"] = contexts
        if user_contexts is not UNDEFINED:
            params["userContexts"] = user_contexts

        return params

    @command
    def set_timezone_override(
            self,
            timezone: Optional[str],
            contexts: Undefinable[List[str]] = UNDEFINED,
            user_contexts: Undefinable[List[str]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {
            "timezone": timezone
        }

        if contexts is not UNDEFINED:
            params["contexts"] = contexts
        if user_contexts is not UNDEFINED:
            params["userContexts"] = user_contexts

        return params

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
