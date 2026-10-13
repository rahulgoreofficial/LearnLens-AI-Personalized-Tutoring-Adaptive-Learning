import re
from typing import List, Dict, Any
from pathlib import Path

def parse_text_or_markdown(file_path: Path) -> List[Dict[str, Any]]:
    """
    Parses plain text (.txt) and Markdown (.md) documents,
    preserving section titles or line numbers for citation provenance.
    """
    content = file_path.read_text(encoding="utf-8", errors="replace")
    lines = content.splitlines()
    
    # Check if Markdown with headers (# Header)
    sections: List[Dict[str, Any]] = []
    current_title = "Introduction / Overview"
    current_lines: List[str] = []
    start_line = 1

    for idx, line in enumerate(lines):
        line_num = idx + 1
        header_match = re.match(r"^(#{1,4})\s+(.+)$", line)
        
        if header_match:
            if current_lines:
                sec_text = "\n".join(current_lines).strip()
                if sec_text:
                    sections.append({
                        "locator": f"{current_title} (L{start_line}-L{line_num-1})",
                        "text": sec_text,
                    })
                current_lines = []
            current_title = header_match.group(2).strip()
            start_line = line_num
        else:
            current_lines.append(line)

    if current_lines:
        sec_text = "\n".join(current_lines).strip()
        if sec_text:
            sections.append({
                "locator": f"{current_title} (L{start_line}-L{len(lines)})",
                "text": sec_text,
            })

    # If no headers found, chunk by paragraph blocks
    if not sections:
        paragraphs = content.split("\n\n")
        line_cursor = 1
        for p in paragraphs:
            p_clean = p.strip()
            if p_clean:
                p_lines = len(p_clean.splitlines())
                sections.append({
                    "locator": f"Lines {line_cursor}-{line_cursor + p_lines}",
                    "text": p_clean,
                })
                line_cursor += p_lines + 2

    return sections or [{"locator": "Page 1", "text": content}]
