# Spike 1 · Converter bake-off

**Status:** started 2026-10-31, **blocked on model downloads**. Nothing has been converted yet.

## Test book: Ash's PDF (private, never committed)

*Start Your Own Nonprofit Organization*, 2nd ed. (Entrepreneur Press, 2017). Kept outside the repo; file name in the app's test list: `start-your-own-nonprofit.pdf`.

| Property | Value | Why it matters |
| --- | --- | --- |
| Pages | 98, 5 MB, made with "PDF Candy" from an ebook | |
| Text layer | Yes on 89 pages; image-only on 9 (cover, pages 2, 4, 50, 83, 91, 97, 98, and the near-empty 92) | Page 50 is a full-page **Equipment Checklist** image: the converter must OCR it, or we lose it |
| PDF bookmarks | **None** | Outline source gives nothing |
| Page labels | Plain 1…98 (same as PDF pages) | No printed → PDF offset to work out |
| Printed contents (PDF pp. 6–9) | Chapter titles and sections, **no page numbers** | Claude can read titles from it but not where chapters start |
| "CHAPTER N" headings | Found on every chapter's first page | The source that actually gives page numbers here |
| Drop caps | Text pass reads `T\nCHAPTER 1\n…` (the big first letter of the first paragraph comes first) | Heading detection must allow a stray letter before "CHAPTER" |
| Index | Says page numbers were removed | Ignore for boundaries |
| **Trap: bonus excerpt** | PDF pp. 83–98 are a preview of a *different* book (*Start Your Own Business*, 6th ed.) with its own "CHAPTER 1–41" and contents | A naive heading search finds 2 extra "Chapter 1"s and 41 fake chapters. Detection must stop at the end of this book's contents list |

### Expected chapter spans (M2 acceptance fixture)

| Part | PDF pages |
| --- | --- |
| Front matter (cover, title, contents, foreword, preface) | 1–11 |
| Ch 1 Saving the World by Being True to a Mission | 12–15 |
| Ch 2 Setting Up Your Nonprofit for Success | 16–21 |
| Ch 3 Choosing Your Board of Directors | 22–27 |
| Ch 4 Finances Count, Even for a Nonprofit | 28–32 |
| Ch 5 The Executive Director's Role in the Nonprofit | 33–37 |
| Ch 6 Staffing: A Fine Balance | 38–42 |
| Ch 7 Volunteers: Nonprofit Heroes | 43–46 |
| Ch 8 Equipping Your Nonprofit | 47–52 |
| Ch 9 Development: Raising the Funds | 53–59 |
| Ch 10 Website Essentials | 60–65 |
| Ch 11 The Nonprofit World and Social Media | 66–70 |
| Ch 12 Achieving Sustainability and Growth | 71–73 |
| Appendix A Sample Strategic Plan | 74 |
| Appendix B Resources for Nonprofits | 75–76 |
| Glossary | 77–78 |
| Index | 79–82 |
| Not this book (excerpt of another title) | 83–98 |

Found with a pypdfium2 text pass and checked by looking at the pages. 12 chapters are short (3–7 pages each, 62 chapter pages in all), so with the Ideal default of 10 weeks it fits with room to spare.

## Converters: blocked

The cloud session's network policy refuses `huggingface.co`, `cdn-lfs.huggingface.co`, `modelscope.cn` and `download.pytorch.org`. MinerU, Docling and PaddleOCR-VL all fetch their models from those hosts, so none can run here yet. PyPI works, so the packages themselves install.

Two ways forward (they can be combined):

1. **CPU numbers in the cloud:** allow those four hosts in the cloud environment's network settings. Then MinerU pipeline (CPU) and Docling (CPU) run here on this book.
2. **GPU numbers on Ash's PC (needed anyway):** MinerU GPU, MinerU VLM and PaddleOCR-VL need the RTX 3060. Run a Claude session on the PC (Desktop app or `claude remote-control` in the repo folder).

Measurements to record per converter (from `docs/build-0-spikes.md`): seconds per page, peak RAM/VRAM, install and model size, heading and reading order quality, whether the page-50 checklist comes through, and how the grey "tip / stat fact / aha!" boxes are handled.
