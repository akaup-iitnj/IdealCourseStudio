"""Entry point: ``python -m cs_py <tool> [options]``."""

from __future__ import annotations

import argparse
import os
import sys
import traceback

from . import gpu, hello
from . import protocol as p


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="cs_py", description="Course Studio helper tools")
    sub = ap.add_subparsers(dest="tool", required=True)
    hello.add_parser(sub)
    gpu.add_parser(sub)
    return ap


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except Exception:
            pass
    args = build_parser().parse_args(argv)
    if os.environ.get("CS_PARENT_WATCHDOG") == "1":
        p.start_parent_watchdog()
    try:
        return int(args.func(args) or 0)
    except KeyboardInterrupt:
        return 130
    except Exception:
        p.debug(traceback.format_exc())
        p.error("The helper hit a problem it could not handle. Details are in the log file.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
