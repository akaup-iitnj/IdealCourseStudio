# Dev and test machine

Ash's PC (DESKTOP-MO8N0FD) is the development and first test machine.

| Part | Spec | What it means |
| --- | --- | --- |
| CPU | Intel i7-13700F (16 cores / 24 threads) | Fast CPU fallback; `-F` has no integrated graphics |
| RAM | 32 GB | Enough for MinerU + Electron + Whisper together |
| GPU | NVIDIA RTX 3060, 12 GB VRAM | CUDA for MinerU / PaddleOCR-VL / Whisper; NVENC H.264 for lecture encoding. 12 GB fits the VLM converters at batch size 1–2 |
| Storage | 932 GB, ~200 GB free | Fine for models (~10–20 GB) and projects; keep an eye on rendered video |
| OS | Windows 11, 64-bit | |

Rules that follow:

- Time estimates come from a measured speed test on the actual PC, labelled "with GPU" or "CPU only".
- Always keep the CPU path working and test it (force with `CS_FORCE_CPU=1`) — most teacher PCs won't have an NVIDIA card.
- Install the latest NVIDIA Studio/Game Ready driver before the spikes; CUDA itself comes inside the PyTorch wheel.
