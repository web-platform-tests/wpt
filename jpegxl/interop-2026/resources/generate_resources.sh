#!/bin/bash
set -eu

# Regenerates/copies JPEG XL fixtures used by interop-2026 tests.
#
# Always copied from existing Chromium WPT JPEG XL resources:
#   ../../resources/{3x3*}
#
# Optional (if available locally) copied from jxl-rs checkout:
#   ${JXL_RS_TESTDATA:-$HOME/jxl-rs/jxl/resources/test}
#
# This script is intentionally best-effort for local development.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHROMIUM_JPEGXL_RES="$SCRIPT_DIR/../../resources"

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [[ -f "$src" ]]; then
    cp "$src" "$dst"
    echo "copied: $dst"
  else
    echo "missing: $src"
  fi
}

decode_png_ref_if_exists() {
  local src_jxl="$1"
  local dst_png="$2"
  if [[ -f "$src_jxl" ]]; then
    if command -v djxl >/dev/null 2>&1; then
      djxl "$src_jxl" "$dst_png" >/dev/null 2>&1
      echo "generated: $dst_png"
    else
      echo "missing tool: djxl (cannot generate $dst_png)"
    fi
  else
    echo "missing source for png generation: $src_jxl"
  fi
}

# Core Chromium fixtures.
for f in \
  3x3_srgb_lossless.jxl \
  3x3_srgb_lossless.png \
  3x3_srgb_lossy.jxl \
  3x3_srgb_lossy.png \
  3x3a_srgb_lossless.jxl \
  3x3a_srgb_lossless.png \
  3x3_jpeg_recompression.jxl \
  3x3_jpeg_recompression.png
  do
  copy_if_exists "$CHROMIUM_JPEGXL_RES/$f" "$SCRIPT_DIR/$f"
done

# Optional jxl-rs fixtures.
JXL_RS_TESTDATA="${JXL_RS_TESTDATA:-$HOME/jxl-rs/jxl/resources/test}"
JXL_RS_CONF="$JXL_RS_TESTDATA/conformance_test_images"

for f in \
  basic.jxl \
  8x8_noise.jxl \
  with_icc.jxl \
  orientation1_identity.jxl \
  orientation6_rotate_90_cw.jxl \
  orientation8_rotate_90_ccw.jxl \
  green_queen_modular_e3.jxl \
  green_queen_vardct_e3.jxl \
  has_permutation.jxl \
  progressive_ac.jxl \
  spline_on_first_frame.jxl \
  issue648_palette0.jxl \
  hdr_pq_test.jxl \
  hdr_hlg_test.jxl
  do
  copy_if_exists "$JXL_RS_TESTDATA/$f" "$SCRIPT_DIR/$f"
done

copy_if_exists "$JXL_RS_CONF/alpha_nonpremultiplied.jxl" \
  "$SCRIPT_DIR/conformance_alpha_nonpremultiplied.jxl"
copy_if_exists "$JXL_RS_CONF/sunset_logo.jxl" \
  "$SCRIPT_DIR/conformance_sunset_logo.jxl"
copy_if_exists "$JXL_RS_CONF/cmyk_layers.jxl" \
  "$SCRIPT_DIR/conformance_cmyk_layers.jxl"
copy_if_exists "$JXL_RS_CONF/animation_spline.jxl" \
  "$SCRIPT_DIR/conformance_animation_spline.jxl"

# PNG references used by visual reftests.
decode_png_ref_if_exists \
  "$SCRIPT_DIR/green_queen_modular_e3.jxl" \
  "$SCRIPT_DIR/green_queen_modular_e3.png"
decode_png_ref_if_exists \
  "$SCRIPT_DIR/conformance_cmyk_layers.jxl" \
  "$SCRIPT_DIR/conformance_cmyk_layers.png"
decode_png_ref_if_exists \
  "$SCRIPT_DIR/orientation6_rotate_90_cw.jxl" \
  "$SCRIPT_DIR/orientation6_rotate_90_cw.png"

echo "Done: $SCRIPT_DIR"
