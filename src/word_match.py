# Copyright © 2026 Kshanti Greene. All rights reserved.

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


def recompute_all_matches(nodes: list[dict], edges: list[dict]) -> list[tuple[str, str, float]]:
    """Compare every pair of nodes and return (from_id, to_id, weight) for
    pairs that qualify but have no existing edge between them yet."""
    already_linked = {frozenset((e["from_id"], e["to_id"])) for e in edges}

    results = []
    for i, node_a in enumerate(nodes):
        words_a = extract_words(node_a.get("text_content") or "")
        if not words_a:
            continue
        for node_b in nodes[i + 1:]:
            if frozenset((node_a["id"], node_b["id"])) in already_linked:
                continue
            common = words_a & extract_words(node_b.get("text_content") or "")
            if not common:
                continue
            match = math.log(len(common) + 1)
            if match >= MIN_MATCH:
                # direction: earlier-created node is the source
                if (node_a.get("created_at") or "") <= (node_b.get("created_at") or ""):
                    from_id, to_id = node_a["id"], node_b["id"]
                else:
                    from_id, to_id = node_b["id"], node_a["id"]
                print(f"Retroactive edge: {from_id} -> {to_id}, common: {sorted(common)}, weight={match:.4f}")
                results.append((from_id, to_id, match))
                already_linked.add(frozenset((node_a["id"], node_b["id"])))
    return results


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