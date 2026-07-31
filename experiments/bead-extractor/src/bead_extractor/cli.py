from __future__ import annotations

import argparse
import json
import sys
from dataclasses import replace
from pathlib import Path
from typing import Any

import cv2

from .errors import ExtractionError
from .extractor import ExtractionConfig, extract_template
from .grid import GridDetectionConfig


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bead-extract",
        description=(
            "Recover an axis-aligned MARD bead template using pure image processing. "
            "No OCR is used."
        ),
    )
    parser.add_argument("image", type=Path)
    parser.add_argument("--output", "-o", type=Path, default=Path("output"))
    parser.add_argument(
        "--palette", choices=("auto", "221", "264", "291"), default="auto"
    )
    parser.add_argument(
        "--empty-strategy",
        choices=("baseline", "conflict-aware", "compare"),
        default="baseline",
        help=(
            "baseline freezes the original empty classifier; conflict-aware "
            "enables the isolated experiment; compare writes both"
        ),
    )
    parser.add_argument("--max-rows", type=int, default=300)
    parser.add_argument("--max-cols", type=int, default=300)
    parser.add_argument("--max-cells", type=int, default=90_000)
    parser.add_argument("--min-cell-pitch", type=float, default=5.0)
    parser.add_argument("--max-uncertain-fraction", type=float, default=0.005)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    config = ExtractionConfig(
        palette_profile=args.palette,
        empty_strategy=(
            "baseline" if args.empty_strategy == "compare" else args.empty_strategy
        ),
        max_uncertain_fraction=args.max_uncertain_fraction,
        grid=GridDetectionConfig(
            min_pitch=args.min_cell_pitch,
            max_rows=args.max_rows,
            max_cols=args.max_cols,
            max_cells=args.max_cells,
        ),
    )
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    try:
        if args.empty_strategy == "compare":
            return _run_empty_comparison(args.image.resolve(), output, config)
        result = extract_template(args.image.resolve(), config)
    except ExtractionError as error:
        report = {
            "accepted": False,
            "rejectionReasons": [
                {"code": error.code, "message": error.message, **error.details}
            ],
        }
        _write_json(output / "report.json", report)
        print(str(error), file=sys.stderr)
        return 2

    _write_result(output, result)
    warning_count = len(result.report.get("warnings", []))
    print(
        f"Generated {result.grid.rows}x{result.grid.cols} template with "
        f"{warning_count} warning(s): {output / 'result.json'}"
    )
    return 0


def _run_empty_comparison(
    image: Path, output: Path, base_config: ExtractionConfig
) -> int:
    baseline = extract_template(
        image, replace(base_config, empty_strategy="baseline")
    )
    conflict_aware = extract_template(
        image, replace(base_config, empty_strategy="conflict-aware")
    )
    baseline_output = output / "baseline"
    conflict_output = output / "conflict-aware"
    baseline_output.mkdir(parents=True, exist_ok=True)
    conflict_output.mkdir(parents=True, exist_ok=True)
    _write_result(baseline_output, baseline)
    _write_result(conflict_output, conflict_aware)
    comparison = _compare_results(baseline, conflict_aware)
    comparison["paths"] = {
        "baseline": str(baseline_output),
        "conflictAware": str(conflict_output),
    }
    _write_json(output / "comparison.json", comparison)
    print(
        "Generated frozen baseline and conflict-aware outputs; "
        f"{comparison['differences']['changedCells']} cell(s) differ: "
        f"{output / 'comparison.json'}"
    )
    return 0


def _write_result(output: Path, result) -> None:
    _write_json(output / "report.json", result.report)
    _write_artifacts(output, result)
    _write_json(output / "result.json", result.template)


def _compare_results(baseline, conflict_aware) -> dict[str, Any]:
    baseline_beads = baseline.template["beads"]
    conflict_beads = conflict_aware.template["beads"]
    changed = []
    empty_to_bead = 0
    bead_to_empty = 0
    color_changed = 0
    for index, (before, after) in enumerate(
        zip(baseline_beads, conflict_beads, strict=True)
    ):
        if before == after:
            continue
        if before is None and after is not None:
            empty_to_bead += 1
        elif before is not None and after is None:
            bead_to_empty += 1
        else:
            color_changed += 1
        changed.append(
            {
                "index": index,
                "row": index // baseline.grid.cols,
                "col": index % baseline.grid.cols,
                "baseline": before,
                "conflictAware": after,
            }
        )

    def summary(result) -> dict[str, Any]:
        beads = result.template["beads"]
        return {
            "rows": result.grid.rows,
            "cols": result.grid.cols,
            "nonemptyCells": sum(bead is not None for bead in beads),
            "emptyCells": sum(bead is None for bead in beads),
            "colorCount": len(result.template["stats"]),
            "warningCodes": [
                warning["code"] for warning in result.report.get("warnings", [])
            ],
        }

    return {
        "baseline": summary(baseline),
        "conflictAware": summary(conflict_aware),
        "differences": {
            "changedCells": len(changed),
            "emptyToBead": empty_to_bead,
            "beadToEmpty": bead_to_empty,
            "colorChanged": color_changed,
            "cells": changed,
        },
    }


def _write_json(path: Path, data: object) -> None:
    path.write_text(
        f"{json.dumps(data, ensure_ascii=False, indent=2)}\n", encoding="utf-8"
    )


def _write_image(path: Path, image_rgb) -> None:
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    success, encoded = cv2.imencode(path.suffix, image_bgr)
    if not success:
        raise ExtractionError("IMAGE_WRITE_FAILED", f"Cannot encode image: {path}")
    encoded.tofile(path)


def _write_artifacts(output: Path, result) -> None:
    artifacts = result.artifacts
    _write_image(output / "grid-overlay.png", artifacts.grid_overlay)
    _write_image(
        output / "trusted-pixel-mask.png",
        cv2.cvtColor(artifacts.trusted_pixel_mask, cv2.COLOR_GRAY2RGB),
    )
    _write_image(output / "confidence-heatmap.png", artifacts.confidence_heatmap)
    _write_image(output / "reconstructed.png", artifacts.reconstructed)
    _write_image(output / "difference.png", artifacts.difference)
    if artifacts.grid_line_mask is not None:
        _write_image(
            output / "grid-line-mask.png",
            cv2.cvtColor(artifacts.grid_line_mask, cv2.COLOR_GRAY2RGB),
        )
    if artifacts.empty_cell_mask is not None:
        _write_image(
            output / "empty-cell-mask.png",
            cv2.cvtColor(artifacts.empty_cell_mask, cv2.COLOR_GRAY2RGB),
        )


if __name__ == "__main__":
    raise SystemExit(main())
