"""JSON Lines protocol shared with the Electron job runner (src/shared/jobs.ts).

One JSON object per line on stdout:
    {"type": "progress"|"log"|"result"|"error", "step": ..., "chapter": ..., "page": ..., "of": ..., "msg": "..."}

``msg`` is plain English for a teacher. Technical detail goes to stderr (which the app writes to its log file).
Helpers must emit a line at least every 5 seconds while working; the app marks a job stuck after 60 s of silence.
"""

from __future__ import annotations

import json
import sys
import threading
import time
from typing import Any, Literal

LineType = Literal["progress", "log", "result", "error"]
HEARTBEAT_SECONDS = 5.0

_lock = threading.Lock()


def emit(type: LineType, msg: str = "", **fields: Any) -> None:
    obj: dict[str, Any] = {"type": type, "msg": msg}
    obj.update({k: v for k, v in fields.items() if v is not None})
    line = json.dumps(obj, ensure_ascii=False)
    with _lock:
        sys.stdout.write(line + "\n")
        sys.stdout.flush()


def progress(msg: str, **fields: Any) -> None:
    emit("progress", msg, **fields)


def log(msg: str, **fields: Any) -> None:
    emit("log", msg, **fields)


def result(msg: str = "", data: Any = None, **fields: Any) -> None:
    emit("result", msg, data=data, **fields)


def error(msg: str, **fields: Any) -> None:
    emit("error", msg, **fields)


def debug(text: str) -> None:
    """Technical detail for the log file only."""
    sys.stderr.write(text + "\n")
    sys.stderr.flush()


def start_parent_watchdog() -> None:
    """Exit when the app goes away. The app keeps our stdin open; EOF means it quit or crashed,
    so we never leave orphan helpers running (important on Windows, where children outlive parents)."""

    def watch() -> None:
        try:
            while sys.stdin.read(1024):
                pass
        except Exception:
            pass
        debug("stdin closed: parent app is gone, exiting")
        import os

        os._exit(0)

    threading.Thread(target=watch, daemon=True, name="parent-watchdog").start()


class Heartbeat:
    """Re-emits the latest progress line every few seconds while a slow call runs.

    Usage::

        with Heartbeat("Converting Chapter 3", step="convert", chapter=3):
            slow_call()
    """

    def __init__(self, msg: str, interval: float = HEARTBEAT_SECONDS, **fields: Any) -> None:
        self.msg = msg
        self.fields = fields
        self.interval = interval
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._started = 0.0

    def _run(self) -> None:
        while not self._stop.wait(self.interval):
            secs = int(time.monotonic() - self._started)
            progress(f"{self.msg} (still working, {secs} s)", **self.fields)

    def __enter__(self) -> "Heartbeat":
        self._started = time.monotonic()
        progress(self.msg, **self.fields)
        self._thread.start()
        return self

    def __exit__(self, *exc: object) -> None:
        self._stop.set()
        self._thread.join(timeout=1)
