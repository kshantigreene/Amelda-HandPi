from fastapi import APIRouter, HTTPException, BackgroundTasks
from models import NodeCreate, NodeUpdate
import db
import uuid
from word_match import compute_matches

router = APIRouter()


@router.get("/")
def list_nodes():
    return db.list_nodes()


@router.get("/{node_id}")
def get_node(node_id: str):
    return {}


def _create_word_match_edges(text_content: str, candidates: list[dict], new_id: str, now: str) -> None:
    for existing_id, match in compute_matches(text_content, candidates):
        db.create_edge(str(uuid.uuid4()), existing_id, new_id, "auto", "system", now, match)


@router.post("/", status_code=201)
def create_node(body: NodeCreate, background_tasks: BackgroundTasks):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    print("node created: ", body)

    existing_nodes = db.list_nodes()
    new_node = db.create_node(body.id, body.text_content or "", body.node_type, body.creator, now)

    if body.previous_id:
        db.create_edge(str(uuid.uuid4()), body.previous_id, body.id, "sequence", body.creator, now)

    # the previous node already has a sequence edge to this one, so skip the
    # word-overlap comparison for it -- one edge between any two nodes is enough.
    candidates = [n for n in existing_nodes if n["id"] != body.previous_id]
    background_tasks.add_task(_create_word_match_edges, body.text_content or "", candidates, body.id, now)

    return new_node


@router.put("/{node_id}")
def update_node(node_id: str, body: NodeUpdate):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    result = db.update_node(node_id, body.text_content or "", now)
    print("node updated: ",body)
    if result is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return result


@router.delete("/{node_id}", status_code=204)
def delete_node(node_id: str):
    return None
