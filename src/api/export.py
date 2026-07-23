# Copyright © 2026 Kshanti Greene. All rights reserved.

from fastapi import APIRouter, HTTPException
from collections import deque
import db

router = APIRouter()

EXPORT_TYPES = {"sequence", "user"}


def _subgraph(node_id: str, all_nodes: list, all_edges: list) -> dict:
    nodes_by_id = {n["id"]: n for n in all_nodes}
    if node_id not in nodes_by_id:
        raise HTTPException(status_code=404, detail="Node not found")

    visited = set()
    queue = deque([node_id])
    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)
        for e in all_edges:
            if e["relationship_type"] not in EXPORT_TYPES:
                continue
            if e["from_id"] == current and e["to_id"] not in visited:
                queue.append(e["to_id"])
            elif e["to_id"] == current and e["from_id"] not in visited:
                queue.append(e["from_id"])

    result_nodes = [nodes_by_id[nid] for nid in visited if nid in nodes_by_id]
    result_edges = [
        e for e in all_edges
        if e["relationship_type"] in EXPORT_TYPES
        and e["from_id"] in visited
        and e["to_id"] in visited
    ]
    return {"nodes": result_nodes, "edges": result_edges}


@router.get("/all")
def export_all():
    return {"nodes": db.list_nodes(), "edges": db.list_edges()}


@router.get("/connected/{node_id}")
def export_connected(node_id: str):
    return _subgraph(node_id, db.list_nodes(), db.list_edges())