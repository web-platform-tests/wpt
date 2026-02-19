import time
from typing import Any, Callable, Optional


class ApiWrapper:
    def __init__(self, pid: int, product_name: str, timeout: float) -> None:
        """Setup for accessibility API testing.

        :pid: The PID of the process which exposes the accessibility API.
        :product_name: The name of the browser, used to find the browser in the accessibility API.
        :timeout: The timeout the test harness has set for this test, local timeouts can be set based on it.
        """
        self.product_name: str = product_name
        self.pid: int = pid
        self.root: Optional[Any] = None
        self.document: Optional[Any] = None
        self.test_url: Optional[str] = None
        self.timeout: float = timeout

        self.root = self._find_browser()

        if not self.root:
            raise Exception(
                f"Couldn't find browser {self.product_name} in accessibility API {self.ApiName}."
            )

    def _find_browser(self) -> Any:
        pass

    def _poll_for(self, find: Callable[[], Any], error: str) -> Any:
        """Poll until the `find` function returns something.

        :param url: The url of the test.
        :return: Whatever find returns.
        """
        found = find()
        stop = time.time() + self.timeout
        while not found:
            if time.time() > stop:
                raise TimeoutError(error)
            time.sleep(0.01)
            found = find()

        return found
