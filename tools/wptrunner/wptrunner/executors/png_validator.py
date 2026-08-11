from __future__ import annotations

import enum
import struct
import zlib
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


class ColorSpace(enum.Enum):
    """Colour spaces matching the `colorSpace` BiDi parameter."""
    SRGB = "srgb"
    DISPLAY_P3 = "display-p3"
    REC2020 = "rec2020"
    REC2100_PQ = "rec2100-pq"
    REC2100_HLG = "rec2100-hlg"


class MalformedCaptureError(Exception):
    """PNG payload violates the capture contract."""


class InvalidPNGError(Exception):
    """Bytestream is not a valid PNG."""


@dataclass
class PngInfo:
    """Parsed PNG metadata for contract validation and comparison."""
    width: int
    height: int
    bit_depth: int
    color_type: int
    color_space: ColorSpace
    has_srgb: bool = False
    has_iccp: bool = False
    has_cicp: bool = False
    iccp_profile_name: Optional[str] = None
    cicp_primaries: Optional[int] = None
    cicp_transfer_function: Optional[int] = None
    interlaced: bool = False
    alpha: bool = False


@dataclass
class CaptureContract:
    """Expected PNG properties for a given requested colour space."""
    color_space: ColorSpace
    min_bit_depth: int = 8
    max_bit_depth: int = 16
    require_alpha: bool = False
    allow_alpha: bool = True


_PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

_CT_GRAY = 0
_CT_RGB = 2
_CT_INDEXED = 3
_CT_GRAY_ALPHA = 4
_CT_RGBA = 6


def _chunk_crc(chunk_type: bytes, data: bytes) -> int:
    return zlib.crc32(chunk_type + data) & 0xFFFFFFFF


def _parse_ihdr(data: bytes) -> Tuple[int, int, int, int, int]:
    width, height, bit_depth, color_type, _compression, _filter_m, interlace = \
        struct.unpack(">LLBBBBB", data[:13])
    return width, height, bit_depth, color_type, interlace


def _parse_cicp(data: bytes) -> Tuple[int, int]:
    if len(data) < 4:
        return (0, 0)
    return data[0], data[1]


def _resolve_color_space_from_chunks(
    has_srgb: bool,
    iccp_name: Optional[str],
    cicp_primaries: Optional[int],
    cicp_transfer: Optional[int],
) -> ColorSpace:
    if has_srgb:
        return ColorSpace.SRGB

    if cicp_primaries is not None and cicp_transfer is not None:
        # Display-P3 primaries (12) + sRGB transfer (13)
        if cicp_primaries == 12 and cicp_transfer == 13:
            return ColorSpace.DISPLAY_P3
        # Rec.2020 primaries (9) + sRGB/bt709 transfer
        if cicp_primaries == 9 and cicp_transfer in (1, 13, 14, 15):
            return ColorSpace.REC2020
        # Rec.2020 primaries (9) + PQ transfer (16)
        if cicp_primaries == 9 and cicp_transfer == 16:
            return ColorSpace.REC2100_PQ
        # Rec.2020 primaries (9) + HLG transfer (18)
        if cicp_primaries == 9 and cicp_transfer == 18:
            return ColorSpace.REC2100_HLG
        # sRGB primaries (1) + sRGB transfer (13)
        if cicp_primaries == 1 and cicp_transfer == 13:
            return ColorSpace.SRGB

    if iccp_name is not None:
        name_lower = iccp_name.lower()
        if "display p3" in name_lower or "display-p3" in name_lower:
            return ColorSpace.DISPLAY_P3
        if "rec2020" in name_lower or "rec.2020" in name_lower:
            return ColorSpace.REC2020
        if "rec2100" in name_lower or "rec.2100" in name_lower:
            if "pq" in name_lower or "smpte2084" in name_lower:
                return ColorSpace.REC2100_PQ
            if "hlg" in name_lower:
                return ColorSpace.REC2100_HLG

    return ColorSpace.SRGB


def parse_png(png_bytes: bytes) -> PngInfo:
    if not png_bytes.startswith(_PNG_SIGNATURE):
        raise InvalidPNGError("Data does not start with PNG signature")

    pos = len(_PNG_SIGNATURE)
    ihdr_found = False
    iend_found = False
    width = height = bit_depth = color_type = interlace = 0
    has_srgb = False
    iccp_name: Optional[str] = None
    has_iccp = False
    cicp_primaries: Optional[int] = None
    cicp_transfer: Optional[int] = None
    has_cicp = False

    while pos < len(png_bytes) and not iend_found:
        if pos + 8 > len(png_bytes):
            raise InvalidPNGError("Truncated PNG: cannot read chunk header")

        length, chunk_type = struct.unpack(">L4s", png_bytes[pos : pos + 8])
        pos += 8
        chunk_end = pos + length

        if chunk_end + 4 > len(png_bytes):
            raise InvalidPNGError(
                f"Truncated PNG: chunk {chunk_type!r} extends past end of data"
            )

        chunk_data = png_bytes[pos:chunk_end]
        pos = chunk_end
        crc = struct.unpack(">L", png_bytes[pos : pos + 4])[0]
        pos += 4

        expected_crc = _chunk_crc(chunk_type, chunk_data)
        if crc != expected_crc:
            raise InvalidPNGError(f"CRC mismatch in chunk {chunk_type!r}")

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, interlace = _parse_ihdr(chunk_data)
            ihdr_found = True
        elif chunk_type == b"sRGB":
            has_srgb = True
        elif chunk_type == b"iCCP":
            has_iccp = True
            null_pos = chunk_data.find(b"\x00")
            if null_pos > 0:
                iccp_name = chunk_data[:null_pos].decode("ascii", errors="replace")
        elif chunk_type == b"cICP":
            has_cicp = True
            cicp_primaries, cicp_transfer = _parse_cicp(chunk_data)
        elif chunk_type == b"IEND":
            iend_found = True

    if not ihdr_found:
        raise InvalidPNGError("No IHDR chunk found")
    if not iend_found:
        raise InvalidPNGError("No IEND chunk found")

    color_space = _resolve_color_space_from_chunks(
        has_srgb, iccp_name, cicp_primaries, cicp_transfer
    )

    return PngInfo(
        width=width,
        height=height,
        bit_depth=bit_depth,
        color_type=color_type,
        color_space=color_space,
        has_srgb=has_srgb,
        has_iccp=has_iccp,
        has_cicp=has_cicp,
        iccp_profile_name=iccp_name,
        cicp_primaries=cicp_primaries,
        cicp_transfer_function=cicp_transfer,
        interlaced=interlace != 0,
        alpha=color_type in (_CT_GRAY_ALPHA, _CT_RGBA),
    )


def validate_contract(png_info: PngInfo, contract: CaptureContract) -> None:
    if png_info.color_space != contract.color_space:
        raise MalformedCaptureError(
            f"Colour space mismatch: PNG reports {png_info.color_space.value}, "
            f"expected {contract.color_space.value}"
        )

    if not (contract.min_bit_depth <= png_info.bit_depth <= contract.max_bit_depth):
        raise MalformedCaptureError(
            f"Bit depth {png_info.bit_depth} is not in accepted range "
            f"[{contract.min_bit_depth}, {contract.max_bit_depth}]"
        )

    if png_info.color_type not in (_CT_RGB, _CT_RGBA):
        raise MalformedCaptureError(
            f"Unexpected PNG colour type {png_info.color_type} (expected RGB or RGBA)"
        )

    if png_info.interlaced:
        raise MalformedCaptureError("Interlaced PNG is not supported")
    if png_info.color_type == _CT_RGBA and not contract.allow_alpha:
        raise MalformedCaptureError("Alpha channel present but not allowed by contract")
    if png_info.color_type == _CT_RGB and contract.require_alpha:
        raise MalformedCaptureError("Alpha channel required but not present")


def decode_pixels_stdlib(
    png_bytes: bytes, info: PngInfo
) -> Tuple[List[List[int]], int, int, int]:
    """Returns (rows, width, height, channels) where *rows* is a list of rows,
    each row is a flat list of channel values (R, G, B[, A])."""
    pos = len(_PNG_SIGNATURE)
    idat_chunks: List[bytes] = []

    while pos < len(png_bytes):
        length, chunk_type = struct.unpack(">L4s", png_bytes[pos : pos + 8])
        pos += 8
        chunk_data = png_bytes[pos : pos + length]
        pos += length + 4  # skip CRC

        if chunk_type == b"IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    raw = zlib.decompress(b"".join(idat_chunks))

    _CT_TO_CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
    channels = _CT_TO_CHANNELS.get(info.color_type, 3)
    bytes_per_channel = info.bit_depth // 8
    pixel_bytes = channels * bytes_per_channel
    stride = info.width * pixel_bytes + 1  # +1 for filter byte

    rows: List[List[int]] = []
    prev_recon: Optional[List[int]] = None

    for y in range(info.height):
        row_start = y * stride
        filter_byte = raw[row_start]
        row_data = list(raw[row_start + 1 : row_start + stride])

        if filter_byte == 0:  # None
            pass
        elif filter_byte == 1:  # Sub
            for i in range(pixel_bytes, len(row_data)):
                row_data[i] = (row_data[i] + row_data[i - pixel_bytes]) & 0xFF
        elif filter_byte == 2:  # Up
            for i in range(len(row_data)):
                up = prev_recon[i] if prev_recon is not None else 0
                row_data[i] = (row_data[i] + up) & 0xFF
        elif filter_byte == 3:  # Average
            for i in range(len(row_data)):
                left = row_data[i - pixel_bytes] if i >= pixel_bytes else 0
                up = prev_recon[i] if prev_recon is not None else 0
                row_data[i] = (row_data[i] + (left + up) // 2) & 0xFF
        elif filter_byte == 4:  # Paeth
            for i in range(len(row_data)):
                left = row_data[i - pixel_bytes] if i >= pixel_bytes else 0
                up = prev_recon[i] if prev_recon is not None else 0
                up_left = (
                    prev_recon[i - pixel_bytes]
                    if prev_recon is not None and i >= pixel_bytes
                    else 0
                )
                row_data[i] = (row_data[i] + _paeth_predictor(left, up, up_left)) & 0xFF
        else:
            raise InvalidPNGError(f"Unknown PNG filter byte: {filter_byte}")

        prev_recon = row_data

        if info.interlaced:
            raise InvalidPNGError("Interlaced PNG is not supported")

        if bytes_per_channel == 1:
            rows.append(list(row_data))
        else:
            row_channels = []
            for i in range(0, len(row_data), 2):
                val = struct.unpack(">H", bytes(row_data[i : i + 2]))[0]
                row_channels.append(val)
            rows.append(row_channels)

    return rows, info.width, info.height, channels


def _paeth_predictor(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


_DEFAULT_CONTRACTS: Dict[str, CaptureContract] = {
    "srgb": CaptureContract(ColorSpace.SRGB, min_bit_depth=8, max_bit_depth=8),
    "display-p3": CaptureContract(ColorSpace.DISPLAY_P3, min_bit_depth=8, max_bit_depth=16),
    "rec2020": CaptureContract(ColorSpace.REC2020, min_bit_depth=8, max_bit_depth=16),
    "rec2100-pq": CaptureContract(ColorSpace.REC2100_PQ, min_bit_depth=10, max_bit_depth=16),
    "rec2100-hlg": CaptureContract(ColorSpace.REC2100_HLG, min_bit_depth=10, max_bit_depth=16),
}


def get_contract(color_space_id: str) -> Optional[CaptureContract]:
    return _DEFAULT_CONTRACTS.get(color_space_id)
