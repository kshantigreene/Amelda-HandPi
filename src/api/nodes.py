from fastapi import APIRouter, HTTPException
from models import NodeCreate, NodeUpdate
import db
import uuid
from word_match import compute_matches, recompute_all_matches

router = APIRouter()


@router.get("/")
def list_nodes():
    return db.list_nodes()


@router.get("/{node_id}")
def get_node(node_id: str):
    node = db.get_node(node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("/", status_code=201)
def create_node(body: NodeCreate):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    print("node created: ", body)

    new_node = db.create_node(body.id, body.text_content or "", body.node_type, body.creator, now)

    if body.previous_id:
        db.create_edge(str(uuid.uuid4()), body.previous_id, body.id, "sequence", body.creator, now)

    return new_node


@router.post("/{node_id}/match-edges", status_code=200)
def match_edges(node_id: str):
    """Run the word-overlap comparison for a node against the rest of the graph
    and create 'auto' edges for any qualifying matches. Called explicitly by the
    client after node creation so it can know exactly when this work is done,
    rather than guessing with a timer."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()

    nodes = db.list_nodes()
    node = next((n for n in nodes if n["id"] == node_id), None)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")

    edges = db.list_edges()
    already_linked = {
        e["to_id"] if e["from_id"] == node_id else e["from_id"]
        for e in edges
        if e["from_id"] == node_id or e["to_id"] == node_id
    }

    # skip nodes that already have any edge to this one -- one edge between
    # any two nodes is enough (e.g. the sequence edge from creation).
    candidates = [n for n in nodes if n["id"] != node_id and n["id"] not in already_linked]

    created = []
    for existing_id, match in compute_matches(node["text_content"] or "", candidates):
        edge_id = str(uuid.uuid4())
        db.create_edge(edge_id, existing_id, node_id, "auto", "system", now, match)
        created.append(edge_id)

    return {"created_edges": created}


@router.put("/{node_id}")
def update_node(node_id: str, body: NodeUpdate):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    result = db.update_node(node_id, body.text_content or "", now)
    print("node updated: ",body)
    if result is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return result


@router.post("/recompute-all-matches", status_code=200)
def recompute_all_matches_endpoint():
    """Retroactively create auto edges for all node pairs that share words but
    have no existing edge between them. Safe to run multiple times."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()

    all_nodes = db.list_nodes()
    all_edges = db.list_edges()

    created = []
    for from_id, to_id, match in recompute_all_matches(all_nodes, all_edges):
        edge_id = str(uuid.uuid4())
        db.create_edge(edge_id, from_id, to_id, "auto", "system", now, match)
        created.append(edge_id)

    return {"created_edges": len(created)}


@router.delete("/{node_id}", status_code=204)
def delete_node(node_id: str):
    if not db.delete_node(node_id):
        raise HTTPException(status_code=404, detail="Node not found")
    return None
