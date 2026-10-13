import re
from typing import List, Dict, Any, Tuple
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url_or_id: str) -> str:
    """
    Extracts the 11-character YouTube video ID from various URL formats or raw ID.
    """
    clean_input = url_or_id.strip()
    if len(clean_input) == 11 and re.match(r"^[A-Za-z0-9_-]{11}$", clean_input):
        return clean_input

    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/watch\?v=|\/live\/)([A-Za-z0-9_-]{11})",
        r"^([A-Za-z0-9_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, clean_input)
        if match:
            return match.group(1)
            
    raise ValueError(f"Could not extract a valid YouTube video ID from: {url_or_id}")

def _format_time(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"

def parse_youtube_transcript(url_or_id: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Fetches transcript for a YouTube video preserving exact timestamps for citations.
    Returns (video_id, list of segment dictionaries).
    """
    video_id = extract_video_id(url_or_id)
    ytt = YouTubeTranscriptApi()

    try:
        # Try fetching English or any available transcript
        fetched = ytt.fetch(video_id, languages=("en", "en-US", "en-GB"))
        raw_data = fetched.to_raw_data()
    except Exception:
        try:
            # Fallback to list and first available
            transcript_list = ytt.list(video_id)
            first_transcript = next(iter(transcript_list))
            raw_data = first_transcript.fetch().to_raw_data()
        except Exception as e:
            raise RuntimeError(f"Failed to fetch YouTube captions for video {video_id}: {str(e)}")

    segments: List[Dict[str, Any]] = []
    current_lines: List[str] = []
    start_sec = 0.0
    end_sec = 0.0

    for item in raw_data:
        text = item.get("text", "").strip()
        text = " ".join(text.split())
        if not text or text == "[Music]" or text == "[Applause]":
            continue

        if not current_lines:
            start_sec = item.get("start", 0.0)

        end_sec = item.get("start", 0.0) + item.get("duration", 0.0)
        current_lines.append(text)

        # Group into ~40-60 second or ~350 character chunks for coherent study context
        if len(" ".join(current_lines)) >= 350 or (end_sec - start_sec) >= 50.0:
            locator = f"{_format_time(start_sec)} - {_format_time(end_sec)}"
            segments.append({
                "timestamp": _format_time(start_sec),
                "locator": locator,
                "text": " ".join(current_lines),
            })
            current_lines = []

    if current_lines:
        locator = f"{_format_time(start_sec)} - {_format_time(end_sec)}"
        segments.append({
            "timestamp": _format_time(start_sec),
            "locator": locator,
            "text": " ".join(current_lines),
        })

    return video_id, segments
