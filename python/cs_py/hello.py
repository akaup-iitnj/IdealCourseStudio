"""Fake job for M0: counts for N seconds, emitting progress every second.

``--hang`` goes silent after a few lines so the app's stuck detection can be seen and tested.
"""

from __future__ import annotations

import argparse
import time

from . import protocol as p


def add_parser(sub: argparse._SubParsersAction) -> None:
    ap = sub.add_parser("hello", help="Fake job that prints progress for a few seconds")
    ap.add_argument("--seconds", type=int, default=10)
    ap.add_argument("--hang", action="store_true", help="Stop printing after 3 steps (tests stuck detection)")
    ap.add_argument("--tick", type=float, default=1.0, help=argparse.SUPPRESS)
    ap.set_defaults(func=run)


def run(args: argparse.Namespace) -> int:
    total = max(1, args.seconds)
    p.log("Sample job started")
    for i in range(1, total + 1):
        p.progress(
            f"Reading sample page {i} of {total}",
            step="Reading sample pages",
            chapter="Sample",
            page=i,
            of=total,
        )
        if args.hang and i >= 3:
            p.debug("--hang: going silent on purpose")
            while True:
                time.sleep(3600)
        time.sleep(args.tick)
    p.result("Sample job finished", data={"pages": total})
    return 0
