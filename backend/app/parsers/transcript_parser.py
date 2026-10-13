import re
from typing import List, Dict, Any
from pathlib import Path

def _format_seconds(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"

def parse_srt(file_path: Path) -> List[Dict[str, Any]]:
    """
    Parses SubRip (.srt) subtitles into timestamped segment blocks.
    Groups lines into ~30-60 second or semantic blocks for sensible chunks.
    """
    content = file_path.read_text(encoding="utf-8", errors="replace")
    # Pattern for SRT blocks: index, timestamp --> timestamp, text
    pattern = re.compile(
        r"(\d+)\s*\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*\n(.*?)(?=\n\s*\d+\s*\n|\Z)",
        re.DOTALL
    )
    
    matches = pattern.findall(content)
    if not matches:
        # Fallback if raw text
        return [{"timestamp": "00:00", "locator": "00:00", "text": content}]

    segments: List[Dict[str, Any]] = []
    current_lines: List[str] = []
    block_start = None
    block_end = None

    for idx, start_ts, end_ts, text in matches:
        cleaned_text = re.sub(r"<[^>]+>", "", text).strip()
        cleaned_text = " ".join(cleaned_text.split())
        if not cleaned_text:
            continue

        if block_start is None:
            block_start = start_ts[:8]

        block_end = end_ts[:8]
        current_lines.append(cleaned_text)

        # Group every 3-4 subtitles or ~300 chars to avoid micro-chunks
        if len(" ".join(current_lines)) >= 300:
            locator = f"{block_start} - {block_end}"
            segments.append({
                "timestamp": block_start,
                "locator": locator,
                "text": " ".join(current_lines),
            })
            current_lines = []
            block_start = None

    if current_lines:
        locator = f"{block_start or '00:00:00'} - {block_end or '00:00:00'}"
        segments.append({
            "timestamp": block_start or "00:00:00",
            "locator": locator,
            "text": " ".join(current_lines),
        })

    return segments

def parse_vtt(file_path: Path) -> List[Dict[str, Any]]:
    """
    Parses WebVTT (.vtt) subtitles with timestamps.
    """
    content = file_path.read_text(encoding="utf-8", errors="replace")
    pattern = re.compile(
        r"(?:(\d{2}:)?\d{2}:\d{2}\.\d{3})\s*-->\s*(?:(\d{2}:)?\d{2}:\d{2}\.\d{3})\s*\n(.*?)(?=\n\s*(?:(?:\d{2}:)?\d{2}:\d{2}\.\d{3})|\Z)",
        re.DOTALL
    )
    matches = pattern.findall(content)
    
    # If regex didn't catch standard blocks, use a simple line parser
    lines = content.splitlines()
    segments: List[Dict[str, Any]] = []
    current_lines: List[str] = []
    current_start = "00:00"
    current_end = "00:00"

    ts_pattern = re.compile(r"((?:\d{2}:)?\d{2}:\d{2}(?:\.\d{3})?)\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}(?:\.\d{3})?)")

    for line in lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("WEBVTT") or line_clean.startswith("NOTE"):
            continue
        ts_match = ts_pattern.search(line_clean)
        if ts_match:
            if current_lines and len(" ".join(current_lines)) >= 250:
                segments.append({
                    "timestamp": current_start,
                    "locator": f"{current_start} - {current_end}",
                    "text": " ".join(current_lines),
                })
                current_lines = []
            current_start = ts_match.group(1).split(".")[0]
            current_end = ts_match.group(2).split(".")[0]
        else:
            text_clean = re.sub(r"<[^>]+>", "", line_clean)
            if text_clean and not text_clean.isdigit():
                current_lines.append(text_clean)

    if current_lines:
        segments.append({
            "timestamp": current_start,
            "locator": f"{current_start} - {current_end}",
            "text": " ".join(current_lines),
        })

    return segments or [{"timestamp": "00:00", "locator": "00:00", "text": content}]

def parse_transcript(file_path: Path) -> List[Dict[str, Any]]:
    suffix = file_path.suffix.lower()
    if suffix == ".srt":
        return parse_srt(file_path)
    elif suffix == ".vtt":
        return parse_vtt(file_path)
    else:
        # Fallback
        text = file_path.read_text(encoding="utf-8", errors="replace")
        return [{"timestamp": "00:00", "locator": "00:00", "text": text}]
