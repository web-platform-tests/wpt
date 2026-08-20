from tests.bidi import get_invalid_cases

MEDIA_FEATURE_NAMES_AND_SAMPLE_VALUES = [
    (
        "any-hover",
        ["none", "hover"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "any-pointer",
        ["none", "coarse", "fine"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "color",
        [0, 8],
        [-1] + get_invalid_cases("number", nullable=True),
    ),
    (
        "color-gamut",
        ["srgb", "p3", "rec2020"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "color-index",
        [0, 1],
        [-1] + get_invalid_cases("number", nullable=True),,
    ),
    (
        "display-mode",
        ["fullscreen", "standalone", "minimal-ui", "browser", "picture-in-picture"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "dynamic-range",
        ["standard", "high"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "environment-blending",
        ["opaque", "additive", "subtractive"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "forced-colors",
        ["none", "active"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "grid",
        [0, 1],
        [-1] + get_invalid_cases("number", nullable=True),,
    ),
    (
        "horizontal-viewport-segments",
        [1, 2],
        [-1] + get_invalid_cases("number", nullable=True),,
    ),
    (
        "hover",
        ["none", "hover"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "inverted-colors",
        ["none", "inverted"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "monochrome",
        [0, 1],
        [-1] + get_invalid_cases("number", nullable=True),,
    ),
    (
        "nav-controls",
        ["none", "back"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "overflow-block",
        ["none", "scroll", "optional-paged", "paged"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "overflow-inline",
        ["none", "scroll"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "pointer",
        ["none", "coarse", "fine"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "prefers-color-scheme",
        ["light", "dark"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "prefers-contrast",
        ["no-preference", "more", "less", "custom"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "prefers-reduced-data",
        ["no-preference", "reduce"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "prefers-reduced-motion",
        ["no-preference", "reduce"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "prefers-reduced-transparency",
        ["no-preference", "reduce"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "scan",
        ["interlace", "progressive"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "scripting",
        ["none", "initial-only", "enabled"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "update",
        ["none", "slow", "fast"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "vertical-viewport-segments",
        [1, 2],
        [-1] + get_invalid_cases("number", nullable=True),,
    ),
    (
        "video-color-gamut",
        ["srgb", "p3", "rec2020"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
    (
        "video-dynamic-range",
        ["standard", "high"],
        ["invalid value"] + get_invalid_cases("string", nullable=True),
    ),
]

