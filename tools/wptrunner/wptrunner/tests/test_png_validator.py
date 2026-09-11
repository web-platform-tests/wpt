import base64
import io
import logging
import struct
import zlib

import pytest

from ..executors.base import RefTestImplementation
from ..executors.png_validator import (
    CaptureContract,
    ColorSpace,
    InvalidPNGError,
    MalformedCaptureError,
    PngInfo,
    decode_pixels_stdlib,
    get_contract,
    parse_png,
    validate_contract,
)


def _chunk(chunk_type: bytes, data: bytes) -> bytes:
    c = chunk_type + data
    crc = zlib.crc32(c) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + c + struct.pack(">I", crc)


_PNG_SIG = b"\x89PNG\r\n\x1a\n"


def _make_png(
    width: int = 4,
    height: int = 4,
    bit_depth: int = 8,
    color_type: int = 2,  # RGB
    extra_chunks: tuple = (),
    idat: bytes | None = None,
) -> bytes:
    ihdr = struct.pack(">IIBBBBB", width, height, bit_depth, color_type, 0, 0, 0)
    parts = [_PNG_SIG, _chunk(b"IHDR", ihdr)]
    parts.extend(extra_chunks)
    if idat is None:
        channels_map = {0: 1, 2: 3, 4: 2, 6: 4}
        ch_count = channels_map.get(color_type, 3)
        bps = bit_depth // 8
        row = b"\x00" + b"\x00" * width * ch_count * bps
        raw = row * height
        idat = zlib.compress(raw)
    parts.append(_chunk(b"IDAT", idat))
    parts.append(_chunk(b"IEND", b""))
    return b"".join(parts)


class TestParsePng:
    def test_basic_8bit_rgb(self):
        png = _make_png()
        info = parse_png(png)
        assert info.width == 4
        assert info.height == 4
        assert info.bit_depth == 8
        assert info.color_type == 2
        assert info.color_space == ColorSpace.SRGB
        assert not info.alpha

    def test_8bit_rgba(self):
        png = _make_png(color_type=6)
        info = parse_png(png)
        assert info.color_type == 6
        assert info.alpha

    def test_16bit_rgb(self):
        png = _make_png(bit_depth=16)
        info = parse_png(png)
        assert info.bit_depth == 16

    def test_srgb_chunk(self):
        png = _make_png(extra_chunks=(_chunk(b"sRGB", b"\x00"),))
        info = parse_png(png)
        assert info.has_srgb
        assert info.color_space == ColorSpace.SRGB

    def test_cicp_display_p3(self):
        png = _make_png(extra_chunks=(_chunk(b"cICP", bytes([12, 13, 0, 1])),))
        info = parse_png(png)
        assert info.has_cicp
        assert info.cicp_primaries == 12
        assert info.cicp_transfer_function == 13
        assert info.color_space == ColorSpace.DISPLAY_P3

    def test_cicp_rec2100_pq(self):
        png = _make_png(extra_chunks=(_chunk(b"cICP", bytes([9, 16, 0, 1])),))
        info = parse_png(png)
        assert info.color_space == ColorSpace.REC2100_PQ

    def test_cicp_rec2100_hlg(self):
        png = _make_png(extra_chunks=(_chunk(b"cICP", bytes([9, 18, 0, 1])),))
        info = parse_png(png)
        assert info.color_space == ColorSpace.REC2100_HLG

    def test_iccp_display_p3(self):
        name = b"Display P3\x00"
        compressed = zlib.compress(b"fake icc profile data")
        chunk_data = name + b"\x00" + compressed
        png = _make_png(extra_chunks=(_chunk(b"iCCP", chunk_data),))
        info = parse_png(png)
        assert info.has_iccp
        assert "display p3" in (info.iccp_profile_name or "").lower()
        assert info.color_space == ColorSpace.DISPLAY_P3

    def test_not_png(self):
        with pytest.raises(InvalidPNGError, match="signature"):
            parse_png(b"not a png file")

    def test_truncated(self):
        with pytest.raises(InvalidPNGError):
            parse_png(_PNG_SIG + b"\x00\x00\x00\x00")

    def test_no_ihdr(self):
        buf = _PNG_SIG + _chunk(b"sRGB", b"\x00") + _chunk(b"IEND", b"")
        with pytest.raises(InvalidPNGError, match="IHDR"):
            parse_png(buf)

    def test_bad_crc(self):
        ihdr = struct.pack(">IIBBBBB", 4, 4, 8, 2, 0, 0, 0)
        c = b"IHDR" + ihdr
        crc = struct.pack(">I", 0xDEADBEEF)
        buf = _PNG_SIG + struct.pack(">I", len(ihdr)) + c + crc + _chunk(b"IEND", b"")
        with pytest.raises(InvalidPNGError, match="CRC"):
            parse_png(buf)


class TestValidateContract:
    def test_ok_8bit_srgb(self):
        info = PngInfo(4, 4, 8, 2, ColorSpace.SRGB)
        contract = CaptureContract(ColorSpace.SRGB)
        validate_contract(info, contract)

    def test_wrong_color_space(self):
        info = PngInfo(4, 4, 8, 2, ColorSpace.DISPLAY_P3)
        contract = CaptureContract(ColorSpace.SRGB)
        with pytest.raises(MalformedCaptureError, match="Colour space mismatch"):
            validate_contract(info, contract)

    def test_bit_depth_too_low(self):
        info = PngInfo(4, 4, 8, 2, ColorSpace.REC2100_PQ)
        contract = CaptureContract(ColorSpace.REC2100_PQ, min_bit_depth=10)
        with pytest.raises(MalformedCaptureError, match="Bit depth"):
            validate_contract(info, contract)

    def test_bit_depth_too_high(self):
        info = PngInfo(4, 4, 16, 2, ColorSpace.SRGB)
        contract = CaptureContract(ColorSpace.SRGB, max_bit_depth=8)
        with pytest.raises(MalformedCaptureError, match="Bit depth"):
            validate_contract(info, contract)

    def test_wrong_color_type(self):
        info = PngInfo(4, 4, 8, 0, ColorSpace.SRGB)  # grayscale
        contract = CaptureContract(ColorSpace.SRGB)
        with pytest.raises(MalformedCaptureError, match="colour type"):
            validate_contract(info, contract)


class TestDecodePixelsStdlib:
    def test_8bit_rgb_roundtrip(self):
        from PIL import Image as PILImage

        for mode, color_type in [("RGB", 2), ("RGBA", 6)]:
            img = PILImage.new(mode, (7, 3))
            for y in range(3):
                for x in range(7):
                    v = (x * 36 + 3, y * 80 + 5, 127)
                    if mode == "RGBA":
                        v = v + (200 - x * 10,)
                    img.putpixel((x, y), v)

            buf = io.BytesIO()
            img.save(buf, format="PNG")
            png_bytes = buf.getvalue()

            info = parse_png(png_bytes)
            rows, _w, _h, _ch = decode_pixels_stdlib(png_bytes, info)

            flat = []
            for row in rows:
                flat.extend(row)

            img2 = PILImage.open(io.BytesIO(png_bytes))
            pil_flat = []
            for p in img2.get_flattened_data():
                pil_flat.extend(p)

            assert flat == pil_flat, f"{mode}: stdlib != PIL"

    def test_16bit_grayscale_roundtrip(self):
        from PIL import Image as PILImage

        img = PILImage.new("I;16", (5, 3))
        for y in range(3):
            for x in range(5):
                img.putpixel((x, y), x * 10000 + y * 1000)

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_bytes = buf.getvalue()

        info = parse_png(png_bytes)
        rows, _w, _h, _ch = decode_pixels_stdlib(png_bytes, info)

        flat = []
        for row in rows:
            flat.extend(row)

        img2 = PILImage.open(io.BytesIO(png_bytes))
        pil_flat = list(img2.get_flattened_data())

        assert flat == pil_flat, f"16-bit gray: stdlib={flat} != PIL={pil_flat}"

    def test_16bit_rgb_filter0(self):
        row = b"\x00"
        row += struct.pack(">HHH", 0x0000, 0x0000, 0x0000)
        row += struct.pack(">HHH", 0xFFFF, 0xFFFF, 0xFFFF)
        row += struct.pack(">HHH", 0x8000, 0x4000, 0x2000)
        idat = zlib.compress(row)
        png = _make_png(width=3, height=1, bit_depth=16, idat=idat)
        info = parse_png(png)
        rows, _w, _h, _ch = decode_pixels_stdlib(png, info)
        assert rows[0] == [0, 0, 0, 0xFFFF, 0xFFFF, 0xFFFF, 0x8000, 0x4000, 0x2000]

    def test_16bit_rgba_filter0(self):
        row = b"\x00"
        row += struct.pack(">HHHH", 0x0000, 0xFFFF, 0x8000, 0x4000)
        row += struct.pack(">HHHH", 0x1234, 0x5678, 0x9ABC, 0xDEF0)
        idat = zlib.compress(row)
        png = _make_png(width=2, height=1, bit_depth=16, color_type=6, idat=idat)
        info = parse_png(png)
        rows, _w, _h, _ch = decode_pixels_stdlib(png, info)
        assert rows[0] == [0, 0xFFFF, 0x8000, 0x4000, 0x1234, 0x5678, 0x9ABC, 0xDEF0]


class TestGetContract:
    def test_known(self):
        c = get_contract("display-p3")
        assert c is not None
        assert c.color_space == ColorSpace.DISPLAY_P3

    def test_unknown(self):
        assert get_contract("nonexistent") is None

    def test_srgb_limits_8bit(self):
        c = get_contract("srgb")
        assert c.max_bit_depth == 8

    def test_hdr_requires_more_than_8bit(self):
        for cs in ("rec2100-pq", "rec2100-hlg"):
            c = get_contract(cs)
            assert c is not None
            assert c.min_bit_depth >= 10


class _FakeExecutor:
    """Minimal mock so RefTestImplementation can be instantiated."""
    timeout_multiplier = 1
    subsuite = ""
    screenshot_cache = {}
    reftest_screenshot = "fail"
    logger = logging.getLogger("test")


def _b64(png_bytes: bytes) -> str:
    return base64.b64encode(png_bytes).decode()


@pytest.fixture
def impl():
    return RefTestImplementation(_FakeExecutor())


class TestGetDifferences:
    def test_identical(self, impl):
        png = _make_png(width=3, height=2)
        screenshots = (_b64(png), _b64(png))
        max_diff, count = impl.get_differences(screenshots, urls=["a", "b"])
        assert max_diff == 0
        assert count == 0

    def test_one_pixel_diff(self, impl):
        # Two 2×1 RGB PNGs differing by one channel value.
        row = b"\x00" + b"\xff\x00\x00" + b"\x00\xff\x00"
        png_a = _make_png(width=2, height=1, idat=zlib.compress(row))
        row2 = b"\x00" + b"\xfe\x00\x00" + b"\x00\xff\x00"
        png_b = _make_png(width=2, height=1, idat=zlib.compress(row2))
        screenshots = (_b64(png_a), _b64(png_b))
        max_diff, count = impl.get_differences(screenshots, urls=["a", "b"])
        assert max_diff == 1  # 0xff - 0xfe
        assert count == 1

    def test_size_mismatch(self, impl):
        png_a = _make_png(width=3, height=2)
        png_b = _make_png(width=4, height=2)
        screenshots = (_b64(png_a), _b64(png_b))
        max_diff, count = impl.get_differences(screenshots, urls=["a", "b"])
        assert max_diff == 0
        assert count > 0  # triggers failure

    def test_16bit(self, impl):
        row = b"\x00"
        row += struct.pack(">HHH", 0x0000, 0x0000, 0x0000)
        row += struct.pack(">HHH", 0xFFFF, 0xFFFF, 0xFFFF)
        png_a = _make_png(width=2, height=1, bit_depth=16, idat=zlib.compress(row))
        row2 = b"\x00"
        row2 += struct.pack(">HHH", 0x0000, 0x0000, 0x0000)
        row2 += struct.pack(">HHH", 0xFFFE, 0xFFFF, 0xFFFF)
        png_b = _make_png(width=2, height=1, bit_depth=16, idat=zlib.compress(row2))
        screenshots = (_b64(png_a), _b64(png_b))
        max_diff, count = impl.get_differences(screenshots, urls=["a", "b"])
        assert max_diff == 1
        assert count == 1

    def test_invalid_base64(self, impl):
        max_diff, count = impl.get_differences(("not base64", "also bad"), urls=["a", "b"])
        assert max_diff is None
        assert count is None

    def test_alpha_skipped(self, impl):
        # Two 2×1 RGBA PNGs with same RGB but different alpha.
        row_a = b"\x00" + b"\x80\x40\x20\xff" + b"\x10\x20\x30\x80"
        png_a = _make_png(width=2, height=1, color_type=6, idat=zlib.compress(row_a))
        row_b = b"\x00" + b"\x80\x40\x20\x00" + b"\x10\x20\x30\x00"
        png_b = _make_png(width=2, height=1, color_type=6, idat=zlib.compress(row_b))
        screenshots = (_b64(png_a), _b64(png_b))

        # Without contract: composited against black → alpha matters.
        max_diff, count = impl.get_differences(screenshots, urls=["a", "b"])
        assert max_diff == 128  # 0x80*255//255 vs 0x80*0//255
        assert count == 2  # both pixels differ

        # With contract: alpha dropped, raw RGB compared → identical.
        from ..executors.png_validator import CaptureContract, ColorSpace
        contract = CaptureContract(ColorSpace.SRGB)
        max_diff2, count2 = impl.get_differences(
            screenshots, urls=["a", "b"], contract=contract
        )
        assert max_diff2 == 0
        assert count2 == 0

    def test_solid_colour_warns(self, impl):
        row = b"\x00" + b"\xFF\x00\x00" * 2
        png = _make_png(width=2, height=2, idat=zlib.compress(row * 2))
        impl.message = []
        impl.get_differences((_b64(png), _b64(png)), urls=["a", "b"])
        assert any("solid colour" in m for m in impl.message)
        assert any("FF0000" in m for m in impl.message)


class TestCheckPass:
    def _hash(self, screenshots):
        h = ["a", "b"]
        return (h[:len(screenshots[0])], h[:len(screenshots[1])])

    def test_pass_identical(self, impl):
        png = _make_png()
        b64 = _b64(png)
        screenshots = ([b64], [b64])
        hashes = (["h1"], ["h1"])
        result, page = impl.check_pass(
            hashes, screenshots, ["test", "ref"], "==", None
        )
        assert result is True
        assert page == -1

    def test_fail_different(self, impl):
        png_a = _make_png()
        # Make a different PNG by changing a pixel.
        row = b"\x00" + b"\x80\x80\x80" * 4
        png_b = _make_png(width=4, height=1, idat=zlib.compress(row))
        screenshots = ([_b64(png_a)], [_b64(png_b)])
        hashes = (["h1"], ["h2"])
        result, _page = impl.check_pass(
            hashes, screenshots, ["test", "ref"], "==", None
        )
        assert result is False

    def test_contract_valid(self, impl):
        png = _make_png(extra_chunks=(_chunk(b"cICP", bytes([12, 13, 0, 1])),))
        b64 = _b64(png)
        screenshots = ([b64], [b64])
        hashes = (["h1"], ["h1"])
        result, page = impl.check_pass(
            hashes, screenshots, ["test", "ref"], "==", None,
            color_space="display-p3",
        )
        assert result is True
        assert page == -1

    def test_contract_violation_wrong_space(self, impl):
        # PNG is sRGB but contract expects Display-P3.
        png = _make_png()
        b64 = _b64(png)
        screenshots = ([b64], [b64])
        hashes = (["h1"], ["h1"])
        result, _page = impl.check_pass(
            hashes, screenshots, ["test", "ref"], "==", None,
            color_space="display-p3",
        )
        # Contract violation → (None, page_idx)
        assert result is None

    def test_no_contract_no_validation(self, impl):
        # Without color_space, even a Display-P3 PNG is compared without error.
        png = _make_png(extra_chunks=(_chunk(b"cICP", bytes([12, 13, 0, 1])),))
        b64 = _b64(png)
        screenshots = ([b64], [b64])
        hashes = (["h1"], ["h1"])
        result, page = impl.check_pass(
            hashes, screenshots, ["test", "ref"], "==", None
        )
        assert result is True
        assert page == -1


    def test_fuzzy_with_high_bit_depth_fails(self, impl):
        png = _make_png(bit_depth=16, extra_chunks=(_chunk(b"cICP", bytes([12, 13, 0, 1])),))
        b64 = _b64(png)
        screenshots = ([b64], [b64])
        hashes = (["h1"], ["h1"])
        result, page = impl.check_pass(
            hashes, screenshots, ["test", "ref"], "==", ([10, 10], [100, 100]),
            color_space="display-p3",
        )
        assert result is None
