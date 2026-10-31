"""Detect an NVIDIA GPU: torch.cuda when torch is installed, else nvidia-smi. ``CS_FORCE_CPU=1`` forces CPU."""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
from typing import Any

from . import protocol as p


def add_parser(sub: argparse._SubParsersAction) -> None:
    ap = sub.add_parser("gpu", help="Report GPU availability")
    ap.set_defaults(func=run)


def _none(source: str = "none") -> dict[str, Any]:
    return {"available": False, "name": None, "vramGb": None, "driver": None, "source": source}


def detect_torch() -> dict[str, Any] | None:
    try:
        import torch  # type: ignore[import-not-found]
    except Exception:
        return None
    try:
        if not torch.cuda.is_available():
            return None
        props = torch.cuda.get_device_properties(0)
        return {
            "available": True,
            "name": props.name,
            "vramGb": round(props.total_memory / 1024**3, 1),
            "driver": None,
            "source": "torch",
        }
    except Exception as e:  # pragma: no cover - depends on hardware
        p.debug(f"torch cuda probe failed: {e!r}")
        return None


def parse_nvidia_smi(output: str) -> dict[str, Any] | None:
    """Parse ``nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits``."""
    first = next((ln for ln in output.splitlines() if ln.strip()), None)
    if not first:
        return None
    parts = [x.strip() for x in first.split(",")]
    if len(parts) < 3:
        return None
    try:
        vram = round(float(parts[1]) / 1024, 1)
    except ValueError:
        vram = None
    return {"available": True, "name": parts[0], "vramGb": vram, "driver": parts[2], "source": "nvidia-smi"}


def detect_nvidia_smi() -> dict[str, Any] | None:
    exe = shutil.which("nvidia-smi")
    if not exe:
        return None
    try:
        out = subprocess.run(
            [exe, "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader,nounits"],
            capture_output=True,
            text=True,
            timeout=15,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except Exception as e:
        p.debug(f"nvidia-smi failed: {e!r}")
        return None
    if out.returncode != 0:
        p.debug(f"nvidia-smi exit {out.returncode}: {out.stderr}")
        return None
    return parse_nvidia_smi(out.stdout)


def detect() -> dict[str, Any]:
    if os.environ.get("CS_FORCE_CPU") == "1":
        return _none("forced-cpu")
    return detect_torch() or detect_nvidia_smi() or _none()


def run(args: argparse.Namespace) -> int:
    p.progress("Checking for a graphics card", step="Checking this PC")
    gpu = detect()
    msg = f"Found {gpu['name']}" if gpu["available"] else "No NVIDIA graphics card found; using the CPU"
    p.result(msg, data={"gpu": gpu, "python": platform.python_version()})
    return 0
