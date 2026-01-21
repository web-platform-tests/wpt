"""Instrumentation for measuring high-level time spent on various tasks inside the runner.

This is lower fidelity than an actual profile, but allows custom data to be considered,
so that we can see the time spent in specific tests and test directories.


Instruments are intended to be used as context managers with the return value of __enter__
containing the user-facing API e.g.

with Instrument(*args) as recording:
    recording.set(["init"])
    do_init()
    recording.pause()
    for thread in test_threads:
       thread.start(recording, *args)
    for thread in test_threads:
       thread.join()
    recording.set(["teardown"])   # un-pauses the Instrument
    do_teardown()
"""

from __future__ import annotations

import threading
import time
from abc import ABCMeta, abstractmethod
from typing import TYPE_CHECKING, Iterable, Sequence

from . import mpcontext

if TYPE_CHECKING:
    import multiprocessing
    import sys
    from multiprocessing.process import BaseProcess
    from types import TracebackType

    if sys.version_info >= (3, 10):
        from typing import TypeAlias
    else:
        from typing_extensions import TypeAlias

    if sys.version_info >= (3, 11):
        from typing import Self
    else:
        from typing_extensions import Self


class AbstractInstrument(metaclass=ABCMeta):
    @abstractmethod
    def __enter__(self) -> AbstractInstrumentHandler:
        ...

    @abstractmethod
    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        ...


class AbstractInstrumentHandler(metaclass=ABCMeta):
    @abstractmethod
    def set(self, stack: Sequence[str]) -> None:
        """Set the current task to stack

        :param stack: A list of strings defining the current task.
                      These are interpreted like a stack trace so that ["foo"] and
                      ["foo", "bar"] both show up as descendants of "foo"
        """
        ...

    @abstractmethod
    def pause(self) -> None:
        """Stop recording a task on the current thread. This is useful if the thread
        is purely waiting on the results of other threads"""
        ...


class NullInstrument(AbstractInstrument, AbstractInstrumentHandler):
    def set(self, stack: Sequence[str]) -> None:
        """Set the current task to stack

        :param stack: A list of strings defining the current task.
                      These are interpreted like a stack trace so that ["foo"] and
                      ["foo", "bar"] both show up as descendants of "foo"
        """
        pass

    def pause(self) -> None:
        """Stop recording a task on the current thread. This is useful if the thread
        is purely waiting on the results of other threads"""
        pass

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        return


_InstrumentQueue: TypeAlias = "multiprocessing.Queue[tuple[str, int | None, float, Sequence[str] | None]]"


class InstrumentWriter(AbstractInstrumentHandler):
    def __init__(
        self,
        queue: _InstrumentQueue,
    ) -> None:
        self.queue = queue

    def set(self, stack: Sequence[str]) -> None:
        stack = [threading.current_thread().name, *stack]
        stack = self._check_stack(stack)
        self.queue.put(("set", threading.current_thread().ident, time.time(), stack))

    def pause(self) -> None:
        self.queue.put(("pause", threading.current_thread().ident, time.time(), None))

    def _check_stack(self, stack: Sequence[str]) -> Sequence[str]:
        return [item.replace(" ", "_") for item in stack]


class Instrument(AbstractInstrument):
    def __init__(self, file_path: str) -> None:
        """Instrument that collects data from multiple threads and sums the time in each
        thread. The output is in the format required by flamegraph.pl to enable visualisation
        of the time spent in each task.

        :param file_path: - The path on which to write instrument output. Any existing file
                            at the path will be overwritten
        """
        self.path = file_path
        self.queue: _InstrumentQueue | None = None
        self.instrument_proc: BaseProcess | None = None

    def __enter__(self) -> InstrumentWriter:
        assert self.instrument_proc is None
        assert self.queue is None
        mp = mpcontext.get_context()
        self.queue = mp.Queue()
        self.instrument_proc = mp.Process(target=self.run)
        self.instrument_proc.start()
        return InstrumentWriter(self.queue)

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        assert self.instrument_proc is not None
        assert self.queue is not None
        self.queue.put(("stop", None, time.time(), None))
        self.instrument_proc.join()
        self.instrument_proc = None
        self.queue = None

    def run(self) -> None:
        assert self.queue is not None
        known_commands = {"stop", "pause", "set"}
        with open(self.path, "w") as f:
            thread_data: dict[int | None, tuple[Sequence[str], float]] = {}
            while True:
                command, thread, time_stamp, stack = self.queue.get()
                assert command in known_commands

                # If we are done recording, dump the information from all threads to the file
                # before exiting. Otherwise for either 'set' or 'pause' we only need to dump
                # information from the current stack (if any) that was recording on the reporting
                # thread (as that stack is no longer active).
                items: Iterable[tuple[Sequence[str], float]]
                if command == "stop":
                    items = thread_data.values()
                elif thread in thread_data:
                    items = [thread_data.pop(thread)]
                else:
                    items = []
                for output_stack, start_time in items:
                    f.write(
                        "%s %d\n"
                        % (
                            ";".join(output_stack),
                            int(1000 * (time_stamp - start_time)),
                        )
                    )

                if command == "set":
                    assert stack is not None
                    thread_data[thread] = (stack, time_stamp)
                elif command == "stop":
                    break
