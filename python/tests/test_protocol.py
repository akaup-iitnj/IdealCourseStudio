import json
import subprocess
import sys
import time
from pathlib import Path

import pytest

from cs_py import gpu, protocol

ROOT = Path(__file__).resolve().parents[1]


def run_cli(*args: str, timeout: float = 30, env: dict | None = None) -> list[dict]:
    out = subprocess.run(
        [sys.executable, "-m", "cs_py", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=timeout,
        env=env,
    )
    assert out.returncode == 0, out.stderr
    return [json.loads(line) for line in out.stdout.splitlines() if line.strip()]


def test_emit_writes_one_json_object_per_line(capsys):
    protocol.progress("Reading page 1", step="read", page=1, of=2, chapter=None)
    protocol.result("done", data={"x": 1})
    lines = capsys.readouterr().out.splitlines()
    assert json.loads(lines[0]) == {"type": "progress", "msg": "Reading page 1", "step": "read", "page": 1, "of": 2}
    assert json.loads(lines[1]) == {"type": "result", "msg": "done", "data": {"x": 1}}


def test_hello_emits_progress_then_result():
    lines = run_cli("hello", "--seconds", "3", "--tick", "0.01")
    types = [ln["type"] for ln in lines]
    assert types[0] == "log"
    assert types[-1] == "result"
    progress = [ln for ln in lines if ln["type"] == "progress"]
    assert [ln["page"] for ln in progress] == [1, 2, 3]
    assert all(ln["of"] == 3 and ln["msg"] for ln in progress)


def test_hello_hang_goes_silent():
    proc = subprocess.Popen(
        [sys.executable, "-m", "cs_py", "hello", "--seconds", "10", "--tick", "0.01", "--hang"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        time.sleep(1.5)
        assert proc.poll() is None, "hang mode should keep running"
    finally:
        proc.kill()
        out, _ = proc.communicate()
    pages = [json.loads(ln).get("page") for ln in out.splitlines() if ln.strip()]
    assert max(p for p in pages if p) == 3


def test_heartbeat_repeats_while_working(capsys):
    with protocol.Heartbeat("Converting", interval=0.05, step="convert"):
        time.sleep(0.2)
    lines = [json.loads(x) for x in capsys.readouterr().out.splitlines()]
    assert len(lines) >= 3
    assert all(ln["step"] == "convert" for ln in lines)


def test_parse_nvidia_smi():
    info = gpu.parse_nvidia_smi("NVIDIA GeForce RTX 3060, 12288, 581.57\n")
    assert info == {
        "available": True,
        "name": "NVIDIA GeForce RTX 3060",
        "vramGb": 12.0,
        "driver": "581.57",
        "source": "nvidia-smi",
    }
    assert gpu.parse_nvidia_smi("") is None


def test_gpu_force_cpu(monkeypatch):
    monkeypatch.setenv("CS_FORCE_CPU", "1")
    assert gpu.detect()["source"] == "forced-cpu"


@pytest.mark.parametrize("args", [["gpu"]])
def test_gpu_cli_reports_result(args):
    lines = run_cli(*args)
    res = lines[-1]
    assert res["type"] == "result"
    assert set(res["data"]["gpu"]) == {"available", "name", "vramGb", "driver", "source"}
    assert res["data"]["python"].startswith("3.")


def test_parent_watchdog_exits_when_stdin_closes():
    import os

    proc = subprocess.Popen(
        [sys.executable, "-m", "cs_py", "hello", "--seconds", "100", "--tick", "0.05", "--hang"],
        cwd=ROOT,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "CS_PARENT_WATCHDOG": "1"},
    )
    time.sleep(0.8)
    assert proc.poll() is None
    proc.stdin.close()
    assert proc.wait(timeout=5) == 0
    proc.stdout.close()
    proc.stderr.close()
