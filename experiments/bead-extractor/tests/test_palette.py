from __future__ import annotations

import numpy as np

from bead_extractor.palette import delta_e_ciede2000, load_palette, rgb_to_lab


def test_palette_profiles_and_canonical_alias() -> None:
    palette_221 = load_palette("221")
    palette_264 = load_palette("264")

    assert len(palette_221) == 221
    assert len(palette_264) == 263
    assert any(color.code == "Q4" for color in palette_264)
    assert not any(color.code == "R11" for color in palette_264)


def test_delta_e_is_zero_for_identical_colors() -> None:
    lab = rgb_to_lab(np.array([[255, 235, 250]], dtype=float))
    distances = delta_e_ciede2000(lab, lab)

    assert distances.shape == (1, 1)
    assert float(distances[0, 0]) < 1e-10
