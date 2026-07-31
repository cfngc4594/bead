from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import numpy as np

from .errors import ExtractionError
from .models import PaletteColor

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "mard_colors.json"


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.removeprefix("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


@lru_cache(maxsize=4)
def load_palette(profile: str) -> tuple[PaletteColor, ...]:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    try:
        profile_codes = set(data["profiles"][profile])
    except KeyError as error:
        raise ExtractionError(
            "UNKNOWN_PALETTE_PROFILE",
            f"Unsupported MARD palette profile: {profile}",
        ) from error

    aliases: dict[str, str] = data["canonicalAliases"]
    colors_by_code = {item["code"]: item for item in data["colors"]}
    result: list[PaletteColor] = []
    emitted: set[str] = set()

    for item in data["colors"]:
        code = item["code"]
        if code not in profile_codes:
            continue
        canonical_code = aliases.get(code, code)
        if canonical_code in emitted:
            continue
        canonical = colors_by_code[canonical_code]
        result.append(
            PaletteColor(
                code=canonical_code,
                hex=canonical["hex"],
                rgb=hex_to_rgb(canonical["hex"]),
                canonical_code=canonical_code,
            )
        )
        emitted.add(canonical_code)

    return tuple(result)


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """Convert sRGB values in [0, 255] to CIE Lab (D65)."""
    values = np.asarray(rgb, dtype=np.float64) / 255.0
    linear = np.where(
        values <= 0.04045,
        values / 12.92,
        ((values + 0.055) / 1.055) ** 2.4,
    )
    matrix = np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ]
    )
    xyz = linear @ matrix.T
    xyz /= np.array([0.95047, 1.0, 1.08883])
    delta = 6 / 29
    f = np.where(
        xyz > delta**3,
        np.cbrt(xyz),
        xyz / (3 * delta**2) + 4 / 29,
    )
    return np.stack(
        [
            116 * f[..., 1] - 16,
            500 * (f[..., 0] - f[..., 1]),
            200 * (f[..., 1] - f[..., 2]),
        ],
        axis=-1,
    )


def delta_e_ciede2000(lab: np.ndarray, references: np.ndarray) -> np.ndarray:
    """Vectorized CIEDE2000 distance from Lab samples to reference colors."""
    sample = np.asarray(lab, dtype=np.float64)[..., None, :]
    reference = np.asarray(references, dtype=np.float64)
    l1, a1, b1 = np.moveaxis(sample, -1, 0)
    l2, a2, b2 = np.moveaxis(reference, -1, 0)

    c1 = np.hypot(a1, b1)
    c2 = np.hypot(a2, b2)
    c_bar = (c1 + c2) / 2
    g = 0.5 * (1 - np.sqrt(c_bar**7 / (c_bar**7 + 25**7)))
    ap1 = (1 + g) * a1
    ap2 = (1 + g) * a2
    cp1 = np.hypot(ap1, b1)
    cp2 = np.hypot(ap2, b2)
    hp1 = np.mod(np.degrees(np.arctan2(b1, ap1)), 360)
    hp2 = np.mod(np.degrees(np.arctan2(b2, ap2)), 360)

    dl = l2 - l1
    dc = cp2 - cp1
    dh_raw = hp2 - hp1
    dh = np.where(cp1 * cp2 == 0, 0, dh_raw)
    dh = np.where(dh > 180, dh - 360, dh)
    dh = np.where(dh < -180, dh + 360, dh)
    d_h = 2 * np.sqrt(cp1 * cp2) * np.sin(np.radians(dh / 2))

    l_bar = (l1 + l2) / 2
    c_bar_p = (cp1 + cp2) / 2
    hp_sum = hp1 + hp2
    h_bar = np.where(cp1 * cp2 == 0, hp_sum, hp_sum / 2)
    crosses_zero = (cp1 * cp2 != 0) & (np.abs(hp1 - hp2) > 180)
    h_bar = np.where(crosses_zero & (hp_sum < 360), (hp_sum + 360) / 2, h_bar)
    h_bar = np.where(crosses_zero & (hp_sum >= 360), (hp_sum - 360) / 2, h_bar)

    t = (
        1
        - 0.17 * np.cos(np.radians(h_bar - 30))
        + 0.24 * np.cos(np.radians(2 * h_bar))
        + 0.32 * np.cos(np.radians(3 * h_bar + 6))
        - 0.20 * np.cos(np.radians(4 * h_bar - 63))
    )
    sl = 1 + 0.015 * (l_bar - 50) ** 2 / np.sqrt(20 + (l_bar - 50) ** 2)
    sc = 1 + 0.045 * c_bar_p
    sh = 1 + 0.015 * c_bar_p * t
    delta_theta = 30 * np.exp(-(((h_bar - 275) / 25) ** 2))
    rc = 2 * np.sqrt(c_bar_p**7 / (c_bar_p**7 + 25**7))
    rt = -rc * np.sin(np.radians(2 * delta_theta))

    return np.sqrt(
        (dl / sl) ** 2 + (dc / sc) ** 2 + (d_h / sh) ** 2 + rt * (dc / sc) * (d_h / sh)
    )
