import json
import math
import re
from pathlib import Path

MIN_MATCH = 0.0

_STOP_WORDS_PATH = Path(__file__).parent / "stop_words_english.json"
with open(_STOP_WORDS_PATH, encoding="utf-8") as f:
    STOP_WORDS = set(json.load(f))

_WORD_RE = re.compile(r"[a-zA-Z']+")


def extract_words(text: str) -> set[str]:
    if not text:
        return set()
    return {w for w in (m.lower() for m in _WORD_RE.findall(text)) if w not in STOP_WORDS}


def compute_matches(new_text: str, existing_nodes: list[dict]) -> list[tuple[str, float]]:
    new_words = extract_words(new_text)
    if not new_words:
        return []

    matches = []
    for node in existing_nodes:
        common = new_words & extract_words(node.get("text_content") or "")
        if not common:
            continue
        match = math.log(len(common) + 1) #should be at least 1 if there are any in common
        if match >= MIN_MATCH:
            print(f"Edge created: {node['id']} -> new node, common words: {sorted(common)}, weight={match:.4f}")
            matches.append((node["id"], match))
    return matches